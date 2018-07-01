var koodiApp = angular.module('koodiApp', ['ngRoute', 'ui.select', 'ui.bootstrap']);
koodiApp.controller('koodiController', function($scope,$http)
{
  //
  // PRIVAATIT FUNKTIOT
  //
  
  // esim. koodiston (näytettävien koodien) vaihto
  function reset() {
    $scope.koodit = [];
    $scope.koodistokoodilkm = "-";
    $scope.koodistoLataa = true;
    $scope.koodistoonkonumero = "-";
  }
  // aloita alusta (paitsi koodistojen lataus)
  function resetAll() {
    $scope.koodistot = [];
    $scope.koodiOrder = 'arvo';
    $scope.koodiOrderReverse = false;
    $scope.query = "";
    reset();
  }
  
  function fetchKoodistot(koodisto) {
    var uri = $scope.thluri+"?list";
    $http.get(uri).then(function (response){
      angular.forEach(response.data, function(robj,rkey){
        var koodisto_onjo = 0;
        for(i in $scope.koodistot){
          var j = $scope.koodistot[i];
          if (j.arvo == robj.id){
            koodisto_onjo = 1;
            break;
          }
        }
        if(!koodisto_onjo) {
          var obj={};
          obj.id = robj.id;
          obj.selite = robj.name;
          obj.arvo = robj.id;
          $scope.koodistot.push(obj); // viedään löytynyt arvo näytille
          $scope.koodistolkm = $scope.koodistot.length;
          // järjestetään lista
          $scope.koodistot.sort(sort_by('selite',false,function(a){return a.toUpperCase()}));
          if (koodisto && koodisto == robj.id) {
            $scope.koodistot.selected = obj;
            $scope.useKoodisto(koodisto);
          }
        }
      });
      $scope.koodistoLataa = false;
    });
  }

  // koodiarvojen hakeva ja asettava funktio
  function fetchKoodit(koodisto) {
    if(!koodisto) return;
    $scope.koodistokoodilkm = 0;
    var uri = $scope.thluri+"?type=json&codeset="+koodisto;
    $http.get(uri).then(function (response){
      // muutetaan arvot numeroiksi, mikäli *kaikki* arvot on sopivia
      var onkoarvonumero = true;
      $scope.koodistoonkonumero = "tekstinä";
      angular.forEach(response.data, function(robj,rkey){
        var obj={};
        obj.id = robj.id;
        obj.selite = robj.shortname;
        obj.arvo = robj.id;
        if (onkoarvonumero) { // yksin ei numero riittää ja ei yritetä enää
          if (robj.id.match(/^0.+/)) { // etunolla -> ei numero
            onkoarvonumero = false;
          } else if (isNaN(parseInt(robj.id))) { // ei numero
            onkoarvonumero = false;
          } else if (robj.id.match(/[^0-9]/)) { // ei numero
            onkoarvonumero = false;
          }
        }
        obj.alku = robj.begindate;
        obj.loppu = "";
        obj.kuvaus = robj.description;
        if (robj.expirationdate) { obj.loppu=robj.expirationdate; }
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
  // - arvo on osa URIa eli koodiston tunniste
  $scope.fetchKoodistot = function() {
    resetAll();
    fetchKoodistot();
  }
  
  $scope.useKoodisto = function(arvo) {
    if(!arvo) return;
    var koodisto = arvo;
    reset();
    fetchKoodit(koodisto);
    $scope.query = "?koodisto="+arvo;
  }
  
  $scope.toURIParam = function(data) {
    if (!data) return "";
    var ret = Object.keys(data).map(function(k){
      if (k=='arvo') {
        return "koodi="+encodeURIComponent(data[k]);
      }
      if (k=='selite') {
        if (!data[k] || !data[k]) {return "";}
        return encodeURIComponent(k)+"="+encodeURIComponent(data[k]);
      }
    }).join('&');
    if (ret) ret="&"+ret;
    return ret;
  }
  
  //
  // ASETUKSET & ALUSTUS
  //
  
  $scope.baseuri = (location.origin+location.pathname).replace(/\/[^\/]*$/,'/');
  if (location.hostname=='localhost') {
    $scope.baseuri='https://koodistopalvelu.fi/';
  }
  $scope.thluri = $scope.baseuri+"thl.php";
  
  resetAll();
  
  if (QueryString.koodisto) {
    fetchKoodistot(QueryString.koodisto);
  } else {
    fetchKoodistot();
  }
  $scope.search = {};
  if (QueryString.arvo) {
    $scope.search['arvo'] = QueryString.arvo;
  }
  if (QueryString.koodi) {
    $scope.search['arvo'] = QueryString.koodi;
  }
  if (QueryString.selite) {
    $scope.search['selite'] = QueryString.selite;
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
        /*
        if (field=="selite" && Object.keys(value) && Object.keys(value).length>0 && value[Object.keys(value)[0]]) {
          field = Object.keys(value)[0];
          value = value[field];
          fortest = fortest[field];
        }
        //*/
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
