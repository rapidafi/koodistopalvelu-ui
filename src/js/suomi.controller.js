var koodiApp = angular.module('koodiApp', ['ngRoute', 'ui.select', 'ui.bootstrap']);
koodiApp.controller('koodiController', function($scope,$http)
{
  //
  // PRIVAATIT FUNKTIOT
  //
  
  // esim. koodiston (näytettävien koodien) vaihto
  function reset() {
    $scope.koodit = [];
    $scope.koodistoversio = "-"; // näytettävä arvo (ei vaikuta hakuihin)
    $scope.koodistotila = "-"; // näytettävä arvo (ei vaikuta hakuihin)
    $scope.koodistokoodilkm = "-";
    $scope.koodistoLataa = true;
    $scope.koodistoonkonumero = true;
  }
  // aloita alusta (paitsi koodistojen lataus)
  function resetAll() {
    $scope.koodistot = [];
    $scope.koodiOrder = 'arvo';
    $scope.koodiOrderReverse = false;
    $scope.lang = 'fi';
    $scope.query = "";
    reset();
  }
  
  function fetchKoodistot(koodisto) {
    //var uri = $scope.sourceuri+"/?format=json";
    var uri = $scope.sourceuri+"/";
    $http.get(uri).then(function (response){
      //console.debug("fetchKoodistot","response",response)
      angular.forEach(response.data, function(robj,rkey){
        angular.forEach(robj, function(kobj,kkey){
          if (kobj.hasOwnProperty("codeValue")) {
            var koodisto_onjo = false;
            for(i in $scope.koodistot){
              var j = $scope.koodistot[i];
              if (j.arvo == kobj.codeValue){
                koodisto_onjo = true;
                break;
              }
            }
            if(!koodisto_onjo) {
              var obj={};
              obj.arvo = kobj.codeValue;
              obj.versio = kobj.version;
              obj.tila = kobj.status;
              obj.selite = kobj.prefLabel || {'fi':"[n/a]",'sv':"[n/a]",'en':"[n/a]"};
              if (!obj.selite.fi) obj.selite.fi="[n/a]";
              if (!obj.selite.sv) obj.selite.sv="[n/a]";
              if (!obj.selite.en) obj.selite.en="[n/a]";
              $scope.koodistot.push(obj); // viedään löytynyt arvo näytille
              $scope.koodistolkm = $scope.koodistot.length;
              // järjestetään lista
              $scope.koodistot.sort(sort_by('selite',false,function(a){
                if (a.hasOwnProperty($scope.lang))
                  return a[$scope.lang].toUpperCase()
                return null
              }));
              if (koodisto && koodisto == kobj.codeValue) {
                $scope.koodistot.selected = obj;
                $scope.useKoodisto(koodisto);
              }
            }
          }
        });
      });
      $scope.koodistoLataa = false;
    });
  }

  // koodiarvojen hakeva ja asettava funktio
  function fetchKoodit(koodisto) {
    if(!koodisto) return;
    $scope.koodistokoodilkm = 0;
    $scope.koodistoversio = findItem($scope.koodistot,"arvo",koodisto).versio;
    $scope.koodistotila = findItem($scope.koodistot,"arvo",koodisto).tila;
    //var uri = $scope.sourceuri+"/"+koodisto+"/codes"+"/?format=json";
    var uri = $scope.sourceuri+"/"+koodisto+"/codes/";
    $http.get(uri).then(function (response){
      // muutetaan arvot numeroiksi, mikäli *kaikki* arvot on sopivia
      $scope.koodistoonkonumero = true;
      angular.forEach(response.data, function(robj,rkey){
        angular.forEach(robj, function(kobj,kkey){
          if (kobj.hasOwnProperty("codeValue")) {
            var obj={};
            obj.arvo = kobj.codeValue;
            if ($scope.koodistoonkonumero) { // yksikin ei-numero riittää ja ei yritetä enää
              if (obj.arvo.match(/^0.+/)) { // etunolla -> ei numero
                $scope.koodistoonkonumero = false;
              } else if (isNaN(parseInt(obj.arvo))) { // ei numero
                $scope.koodistoonkonumero = false;
              } else if (obj.arvo.match(/[^0-9]/)) { // ei numero
                $scope.koodistoonkonumero = false;
              }
            }
            obj.selite = kobj.prefLabel || {'fi':"[n/a]",'sv':"[n/a]",'en':"[n/a]"};
            if (!obj.selite.fi) obj.selite.fi="[n/a]";
            if (!obj.selite.sv) obj.selite.sv="[n/a]";
            if (!obj.selite.en) obj.selite.en="[n/a]";
            obj.alku = kobj.startDate;
            obj.loppu = "";
            obj.koodiUri = kobj.uri;
            obj.kuvaus = kobj.description || {'fi':"[n/a]",'sv':"[n/a]",'en':"[n/a]"};
            if (kobj.endDate) { obj.loppu=kobj.endDate; }
            $scope.koodit.push(obj); // viedään löytynyt arvo näytille
            $scope.koodistokoodilkm++;
          }
        });
        if ($scope.koodistoonkonumero) {
          for(var i=0; i<$scope.koodit.length; i++) {
            $scope.koodit[i].arvo = parseInt($scope.koodit[i].arvo);
          }
        }
        $scope.koodistoLataa = false;
      });
    });
  }
  
  //
  // SCOPE
  //
  
  // koodistot:
  // - selite on valintalistassa näkyvä
  // - arvo on osa URIa eli koodiston tunniste opintopolussa
  $scope.fetchKoodistot = function() {
    resetAll();
    fetchKoodistot();
  }
  
  $scope.useKoodisto = function(arvo) {
    if(!arvo) return;
    var koodisto = arvo;
    reset();
    fetchKoodit(koodisto);
    // lisätään myös testi/tuotanto-valitsin
    $scope.query = "?source="+$scope.source+"&koodisto="+arvo;
  }
  
  $scope.toURIParam = function(data) {
    if (!data) return "";
    var ret = Object.keys(data).map(function(k){
      if (k=='arvo') {
        return "koodi="+encodeURIComponent(data[k]);
      }
      if (k=='selite') {
        if (!data[k] || !data[k][$scope.lang]) {return "";}
        return encodeURIComponent(k)+"="+encodeURIComponent(data[k][$scope.lang]);
      }
    }).join('&');
    if (ret) ret="&"+ret;
    return ret;
  }
  
  $scope.useSource = function (source) {
    if (source in $scope.sourceuris) {
      console.log("useSource "+source)
      $scope.source = source;
      $scope.sourceuri = $scope.sourceuris[source];
      $scope.fetchKoodistot();
    }
  }
  
  //
  // ASETUKSET & ALUSTUS
  //
  
  $scope.lang = 'fi';
  $scope.flags = {
    'fi':"https://cdn3.iconfinder.com/data/icons/142-mini-country-flags-16x16px/32/flag-finland2x.png",
    'sv':"https://cdn3.iconfinder.com/data/icons/142-mini-country-flags-16x16px/32/flag-sweden2x.png",
    'en':"https://cdn3.iconfinder.com/data/icons/142-mini-country-flags-16x16px/32/flag-united-kingdom2x.png"
  };
  $scope.baseuri = (location.origin+location.pathname).replace(/\/[^\/]*$/,'/');
  if (location.hostname=='localhost') {
    $scope.baseuri='https://koodistopalvelu.fi/';
  }
  $scope.sourceuris = {
    'tuotanto': $scope.baseuri+"api.php?uri=https://koodistot.suomi.fi/codelist-api/api/v1/coderegistries/jhs/codeschemes"
  };
  $scope.source = "tuotanto";
  $scope.sourceuri = $scope.sourceuris[$scope.source];

  $scope.i18n = {
    'codeisnumber':{
      true:{'fi':'numero','sv':'nummer','en':'number'},
      false:{'fi':'teksti','sv':'text','en':'text'}
    },
    'source':{
      'text':{'fi':'Lähde','sv':'Källa','en':'Source'}
    },
    'form':{
      'search':{
        'fi':'Etsi koodistoa',
        'sv':'Sök för en klassifikation',
        'en':'Search for codeset'
      }
    },
    'table':{
      'column':{
        'code':{'fi':'Koodi','sv':'Kod','en':'Code'},
        'label':{'fi':'Selite','sv':'Nyckel','en':'Label'},
        'start':{'fi':'Alku','sv':'Start','en':'Start'},
        'end':{'fi':'Loppu','sv':'End','en':'End'}
      }
    }
  };
  
  resetAll();
  
  if (QueryString.source) {
    if (QueryString.source in $scope.sourceuris) {
      $scope.source = QueryString.source;
      $scope.sourceuri = $scope.sourceuris[$scope.source];
      $scope.query="?source="+$scope.source;
    }
  }
  if (QueryString.koodisto) {
    fetchKoodistot(QueryString.koodisto);
  } else {
    fetchKoodistot();
  }
  if (QueryString.lang) {
    $scope.lang = QueryString.lang;
  }
  $scope.search = {};
  if (QueryString.arvo) {
    $scope.search['arvo'] = QueryString.arvo;
  }
  if (QueryString.koodi) {
    $scope.search['arvo'] = QueryString.koodi;
  }
  if (QueryString.selite) {
    $scope.search['selite'] = {};
    $scope.search['selite'][$scope.lang] = QueryString.selite;
  }
  //$scope.search['alku'] = QueryString.alku;
  //$scope.search['loppu']  QueryString.loppu;
  
});//-koodiController

// Regular Expression filtering
koodiApp.filter('regex', function() {
  return function(input, regex) {
    if(!regex) return input;
    // clear empty strings away
    angular.forEach(regex,function(value,field){
      if(value=="")
        delete regex[field];
    });
    if(angular.equals({},regex)){//nothing to rule out..
      return input;//..so return all
    }
    // else... start finding matches
    var out = [];
    for(var i=0; i<input.length; i++){
      var addit=true;//see if all patterns give ok
      angular.forEach(regex,function(value,field){
        // language selection, key here is field 'selite'!
        var fortest = input[i][field];
        if (field=="selite" && Object.keys(value) && Object.keys(value).length>0 && value[Object.keys(value)[0]]) {
          field = Object.keys(value)[0];
          value = value[field];
          fortest = fortest[field];
        }
        var patt = new RegExp(/.?/);//match anything until...
        try { // catch for ex. unfinished patterns causing exceptions
          patt = new RegExp(value,'i');//...try to use user input
        } catch(e) {
          //console.debug("RegExp exception",e)
        }
        if(!patt.test(fortest)){//if even one says no..
          addit=false;//..it's a no!
        }
      });
      if(addit){
        out.push(input[i]);
      }
    }
    return out;
  };
});
