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
    $scope.koodistoonkonumero = "-";
  }
  // aloita alusta (paitsi koodistojen lataus)
  function resetAll() {
    $scope.koodistot = [];
    $scope.koodiOrder = 'arvo';
    $scope.koodiOrderReverse = false;
    $scope.kieli = 'FI';
    $scope.query = "";
    reset();
  }
  
  function fetchKoodistot(koodisto) {
    var uri = $scope.opintopolkuuri+"/list"
    $http.get(uri).then(function (response){
      angular.forEach(response.data, function(robj,rkey){
        angular.forEach(robj.koodistos, function(kobj,kkey){
          var koodisto_onjo = 0;
          for(i in $scope.koodistot){
            var j = $scope.koodistot[i];
            if (j.arvo == kobj.koodistoUri){
              koodisto_onjo = 1;
              break;
            }
          }
          if(!koodisto_onjo) {
            var obj={};
            obj.versio = kobj.latestKoodistoVersio.versio;
            obj.tila = kobj.latestKoodistoVersio.tila;
            obj.arvo = kobj.koodistoUri;
            obj.selite = {};
            obj.selite.FI = getLanguageSpecificValueOrValidValue(kobj.latestKoodistoVersio.metadata,"nimi","FI");
            obj.selite.SV = getLanguageSpecificValueOrValidValue(kobj.latestKoodistoVersio.metadata,"nimi","SV");
            obj.selite.EN = getLanguageSpecificValueOrValidValue(kobj.latestKoodistoVersio.metadata,"nimi","EN");
            $scope.koodistot.push(obj); // viedään löytynyt arvo näytille
            $scope.koodistolkm = $scope.koodistot.length;
            // järjestetään lista
            $scope.koodistot.sort(sort_by('selite',false,function(a){return a[$scope.kieli].toUpperCase()}));
            if (koodisto && koodisto == kobj.koodistoUri) {
              $scope.koodistot.selected = obj;
              $scope.useKoodisto(koodisto);
            }
          }
        });
      });
      $scope.koodistoLataa = false;
    });
  }

  // koodiarvojen hakeva ja asettava funktio
  function fetchKoodit(koodisto,koodistoversio,koodistotila) {
    if(!koodisto) return;
    if(!koodistoversio) return;
    $scope.koodistoversio = koodistoversio;
    $scope.koodistotila = koodistotila;
    $scope.koodistokoodilkm = 0;
    var uri = $scope.opintopolkuuri+"/codeelement/latest/"+koodisto;
    $http.get(uri).then(function (response){
      // muutetaan arvot numeroiksi, mikäli *kaikki* arvot on sopivia
      var onkoarvonumero = true;
      $scope.koodistoonkonumero = "tekstinä";
      angular.forEach(response.data, function(robj,rkey){
        var obj={};
        obj.selite = {};
        obj.selite.FI = getLanguageSpecificValueOrValidValue(robj.metadata,"nimi","FI");
        obj.selite.SV = getLanguageSpecificValueOrValidValue(robj.metadata,"nimi","SV");
        obj.selite.EN = getLanguageSpecificValueOrValidValue(robj.metadata,"nimi","EN");
        obj.arvo = robj.koodiArvo;
        if (onkoarvonumero) { // yksin ei numero riittää ja ei yritetä enää
          if (robj.koodiArvo.match(/^0.+/)) { // etunolla -> ei numero
            onkoarvonumero = false;
          } else if (isNaN(parseInt(robj.koodiArvo))) { // ei numero
            onkoarvonumero = false;
          } else if (robj.koodiArvo.match(/[^0-9]/)) { // ei numero
            onkoarvonumero = false;
          }
        }
        obj.alku = robj.voimassaAlkuPvm;
        obj.loppu = "";
        obj.koodiUri = robj.koodiUri;
        obj.kuvaus = {};
        obj.kuvaus.FI = getLanguageSpecificValueOrValidValue(robj.metadata,"kuvaus","FI");
        obj.kuvaus.SV = getLanguageSpecificValueOrValidValue(robj.metadata,"kuvaus","SV");
        obj.kuvaus.EN = getLanguageSpecificValueOrValidValue(robj.metadata,"kuvaus","EN");
        if (robj.voimassaLoppuPvm) { obj.loppu=robj.voimassaLoppuPvm; }
        $scope.koodit.push(obj); // viedään löytynyt arvo näytille
        $scope.koodistokoodilkm++;
      });
      if (onkoarvonumero) {
        $scope.koodistoonkonumero = "numeroina";
        for(var i=0; i<$scope.koodit.length; i++) {
          $scope.koodit[i].arvo = parseInt($scope.koodit[i].arvo);
        }
      }
      $scope.koodistoLataa = false;
    });
  }
  
  //
  // SCOPE
  //
  
  // koodistot:
  // - selite on valintalistassa näkyvä
  // - arvo on osa URIa eli koodiston tunniste opintopolussa
  // - versio on koodistoversio: 0=haetaan viimeisin, muuten pakottaa version
  $scope.fetchKoodistot = function() {
    resetAll();
    fetchKoodistot();
  }
  
  $scope.useKoodisto = function(arvo) {
    if(!arvo) return;
    var koodisto = arvo;
    var versio = findItem($scope.koodistot,"arvo",arvo).versio;
    var tila = findItem($scope.koodistot,"arvo",arvo).tila;
    reset();
    //versio; // 0 palauttaa virhetilanteen. ilman koodistoversiota saisi viimeisimmän...
    if (versio==0) {
      // haetaan koodiston tiedot, jotta saadaan aito viimeisin koodiston versio
      var koodistouri = $scope.opintopolkuuri+"/codes/"+koodisto;
      $http.get(koodistouri).then(function(koodistoresponse) {
        var data = koodistoresponse.data.latestKoodistoVersio;
        fetchKoodit(koodisto,data.versio,data.tila);
      });
    } else {
      fetchKoodit(koodisto,versio,tila);
    }
    // lisätään myös testi/tuotanto-valitsin
    $scope.query = "?opintopolku="+$scope.opintopolku+"&koodisto="+arvo;
  }
  
  $scope.toURIParam = function(data) {
    if (!data) return "";
    var ret = Object.keys(data).map(function(k){
      if (k=='arvo') {
        return "koodi="+encodeURIComponent(data[k]);
      }
      if (k=='selite') {
        if (!data[k] || !data[k][$scope.kieli]) {return "";}
        return encodeURIComponent(k)+"="+encodeURIComponent(data[k][$scope.kieli]);
      }
    }).join('&');
    if (ret) ret="&"+ret;
    return ret;
  }
  
  $scope.useOpintopolku = function (opintopolku) {
    if (opintopolku in $scope.opintopolkuuris) {
      console.log("useOpintopolku "+opintopolku)
      $scope.opintopolku = opintopolku;
      $scope.opintopolkuuri = $scope.opintopolkuuris[opintopolku];
      $scope.fetchKoodistot();
    }
  }
  
  //
  // ASETUKSET & ALUSTUS
  //
  
  $scope.kieli = 'FI';
  $scope.flags = {
    FI:"https://cdn3.iconfinder.com/data/icons/142-mini-country-flags-16x16px/32/flag-finland2x.png",
    SV:"https://cdn3.iconfinder.com/data/icons/142-mini-country-flags-16x16px/32/flag-sweden2x.png",
    EN:"https://cdn3.iconfinder.com/data/icons/142-mini-country-flags-16x16px/32/flag-united-kingdom2x.png"
  };
  $scope.baseuri = (location.origin+location.pathname).replace(/\/[^\/]*$/,'/');
  if (location.hostname=='localhost') {
    $scope.baseuri='https://koodistopalvelu.fi/';
  }
  $scope.opintopolkuuris = {
    testi: $scope.baseuri+"opintopolku.php/testi",
    tuotanto: $scope.baseuri+"opintopolku.php"
  };
  $scope.opintopolku = "tuotanto";
  $scope.opintopolkuuri = $scope.opintopolkuuris[$scope.opintopolku];
  
  resetAll();
  
  if (QueryString.opintopolku) {
    if (QueryString.opintopolku in $scope.opintopolkuuris) {
      $scope.opintopolku = QueryString.opintopolku;
      $scope.opintopolkuuri = $scope.opintopolkuuris[$scope.opintopolku];
      $scope.query="?opintopolku="+$scope.opintopolku;
    }
  }
  if (QueryString.koodisto) {
    fetchKoodistot(QueryString.koodisto);
  } else {
    fetchKoodistot();
  }
  if (QueryString.kieli) {
    $scope.kieli = QueryString.kieli;
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
    $scope.search['selite'][$scope.kieli] = QueryString.selite;
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
    let out = [];
    for(let i=0; i<input.length; i++){
      let addit=true;//see if all patterns give ok
      angular.forEach(regex,function(value,field){
        // language selection, key here is field 'selite'!
        let fortest = input[i][field];
        if (field=="selite" && Object.keys(value) && Object.keys(value).length>0 && value[Object.keys(value)[0]]) {
          field = Object.keys(value)[0];
          value = value[field];
          fortest = fortest[field];
        }
        let patt = new RegExp(/.?/);//match anything until...
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
