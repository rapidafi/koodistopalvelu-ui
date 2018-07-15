var koodiApp = angular.module('koodiApp', ['ngRoute', 'ui.select', 'ngSanitize']);
koodiApp.controller('koodiController', function($scope,$http)
{
  $scope.opintopolkuuris = {
    testi: "https://testi.virkailija.opintopolku.fi/koodisto-service/rest",
    tuotanto: "https://virkailija.opintopolku.fi/koodisto-service/rest"
  };
  $scope.opintopolku = "testi";
  $scope.opintopolkuuri = $scope.opintopolkuuris[$scope.opintopolku];
  $scope.relaatio = "yla";

  function reset() {
    $scope.koodit = [];
    $scope.kooditindex = {}; // indeksi koodit-arraylle
    $scope.koodisto = "-"; // näytettävä arvo (ei vaikuta hakuihin)
    $scope.koodistoversio = "-"; // näytettävä arvo (ei vaikuta hakuihin)
    $scope.koodistotila = "-"; // näytettävä arvo (ei vaikuta hakuihin)
    $scope.koodistokoodilkm = "-";
    $scope.koodistoLataa = true;
    $scope.koodistoonkonumero = "-";

    $scope.luokitukset = []; // tarkoituksella tässä! tyhjää valinnan koodistoa vaihdettaessa
    $scope.koodiLuokitus = false;
    $scope.luokitusLataa = false; // nb! eroaa koodistosta!
  }
  // aloita alusta (paitsi koodistojen lataus)
  function resetAll() {
    $scope.koodistot = []; // pitää olla array
    $scope.koodiOrder = 'arvo';
    $scope.koodiOrderReverse = false;
    $scope.kieli = 'FI';
    //$scope.query = "";
    reset();
  }

  // alusta kaikki
  resetAll();

  $scope.useOpintopolku = function (opintopolku) {
    if (opintopolku in $scope.opintopolkuuris) {
      console.log("useOpintopolku "+opintopolku)
      $scope.opintopolku = opintopolku;
      $scope.opintopolkuuri = $scope.opintopolkuuris[opintopolku];
      $scope.fetchKoodistot();
    }
  }

  // koodistot:
  // - selite on valintalistassa näkyvä
  // - arvo on osa URIa eli koodiston tunniste opintopolussa
  // - versio on koodistoversio: 0=haetaan viimeisin, muuten pakottaa version
  $scope.fetchKoodistot = function() {
    console.log("fetchKoodistot")
    $scope.koodistot = [];//pitää olla array
    var uri = $scope.opintopolkuuri+"/json";
    $http.get(uri).then(function (response){
      angular.forEach(response.data, function(robj,rkey){
        angular.forEach(robj.koodistos, function(kobj,kkey){
          // koodistot saattaa esiintyä useasti koodistoryhmien vuoksi
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
            obj.arvo = kobj.koodistoUri;
            obj.selite = getLanguageSpecificValueOrValidValue(kobj.latestKoodistoVersio.metadata,"nimi","FI");
            $scope.koodistot.push(obj); // viedään löytynyt arvo näytille
            $scope.koodistolkm = $scope.koodistot.length;
            // järjestetään koodistolista
            $scope.koodistot.sort(sort_by('selite',false,function(a){return a.toUpperCase()}));
          }
        });
      });
      console.debug("fetchKoodistot $http.get done")
      $scope.koodistoLataa = false;
    });
  }

  // alusta koodistot ladatessa
  $scope.fetchKoodistot();

  /* pitäisi saada tietää jokin kutsu jolla nämä löytyy ilman että joka koodilla...
  function fetchLuokitukset(koodiUri) {
    console.log("fetchLuokitukset")
    if (!(robj.koodisto.koodistoUri in $scope.luokitukset)) {
      var uri = $scope.opintopolkuuri+"/json/relaatio/sisaltyy-alakoodit/"+koodiUri;
      $http.get(uri).then(function (response){
        angular.forEach(response.data, function(robj,rkey){
          var obj={};
          obj.versio = robj.versio;
          obj.arvo = robj.koodisto.koodistoUri;
          obj.selite = getLanguageSpecificValueOrValidValue(robj.metadata,"nimi","FI");
          $scope.luokitukset.push(obj); // viedään löytynyt arvo näytille
          // järjestetään koodistolista
          $scope.luokitukset.sort(sort_by('selite',false,function(a){return a.toUpperCase()}));
        });
        console.debug("fetchLuokitukset $http.get done")
      });
    }
  }
  */

  // koodiarvojen hakeva ja asettava funktio
  function fetchKoodit(koodisto,koodistoversio) {
    console.log("fetchKoodit: "+koodisto+" koodistoversio="+koodistoversio)
    if(!koodisto) return
    if(!koodistoversio) return
    $scope.koodistoversio = koodistoversio;
    $scope.koodistokoodilkm = 0;
    var uri = $scope.opintopolkuuri+"/json/"+koodisto+"/koodi"+"?koodistoVersio="+koodistoversio+"&onlyValidKoodis=false";
    $http.get(uri).then(function (response){
      // muutetaan arvot numeroiksi, mikäli *kaikki* arvot on sopivia
      var onkoarvonumero = true;
      $scope.koodistoonkonumero = "tekstinä";
      angular.forEach(response.data, function(robj,rkey){
        var obj={};
        obj.koodiUri = robj.koodiUri; // avain
        obj.selite = getLanguageSpecificValueOrValidValue(robj.metadata,"nimi","FI");
        obj.arvo = robj.koodiArvo;
        obj.alku = robj.voimassaAlkuPvm;
        obj.loppu = robj.voimassaLoppuPvm||"";
        $scope.koodit.push(obj);
        $scope.kooditindex[obj.koodiUri] = $scope.koodit.length-1;
        $scope.koodistokoodilkm++;
        if (onkoarvonumero) { // yksin ei numero riittää ja ei yritetä enää
          if (robj.koodiArvo.match(/^0/)) { // etunolla -> ei numero
            onkoarvonumero = false;
          } else if (!parseInt(robj.koodiArvo)) { // ei numero
            onkoarvonumero = false;
          } else if (robj.koodiArvo.match(/[^0-9]/)) { // ei numero
            onkoarvonumero = false;
          }
        }
        // haetaan alakoodit luokituksia varten
        /*
        $http.get($scope.opintopolkuuri+"/json/relaatio/sisaltyy-alakoodit/"+obj.koodiUri)
        .then(function(relasponse){
          angular.forEach(response.data, function(lobj,lkey){
            var kobj={};
            kobj.versio = lobj.versio;
            kobj.arvo = lobj.koodisto.koodistoUri;
            kobj.selite = getLanguageSpecificValueOrValidValue(lobj.metadata,"nimi","FI");
            if (!(kobj in $scope.luokitukset)) {
              $scope.luokitukset.push(kobj); // viedään löytynyt arvo näytille
              // järjestetään koodistolista
              $scope.luokitukset.sort(sort_by('selite',false,function(a){return a.toUpperCase()}));
            }
          });
        });
        */
      });
      if (onkoarvonumero) {
        $scope.koodistoonkonumero = "numeroina";
        for(var i=0; i<$scope.koodit.length; i++) {
          $scope.koodit[i].arvo = parseInt($scope.koodit[i].arvo);
        }
      }
      console.debug("fetchKoodit: "+koodisto+" $http.get done")
      $scope.koodistoLataa = false;
    });
  }

  $scope.useKoodisto = function(arvo,versio) {
    console.log("useKoodisto: "+arvo+" "+versio)
    if(!arvo) return
    reset();
    var koodisto = arvo;
    $scope.koodisto = arvo;
    // varaudutaan koodistojen versiotietoihin.
    var koodistoversio = versio; // 0 palauttaa virhetilanteen. ilman koodistoversiota saisi viimeisimmän...
    if (koodistoversio==0) {
      // haetaan koodiston tiedot, jotta saadaan aito viimeisin koodiston versio
      var koodistouri = $scope.opintopolkuuri+"/codes/"+koodisto;
      $http.get(koodistouri).then(function(koodistoresponse) {
        var data = koodistoresponse.data;
        koodistoversio = data.latestKoodistoVersio.versio;
        fetchKoodit(koodisto,koodistoversio);
      });
    } else {
      fetchKoodit(koodisto,koodistoversio);
    }
  }

  // tehdään erillinen objekti, jossa samat avaimet kuin koodit-objektissa
  $scope.useLuokitus = function(arvo,versio) {
    console.debug(new Date().toISOString(),"useLuokitus",arvo,versio)
    if(!arvo) return;
    if($scope.koodisto=="-") return;
    if(arvo == $scope.koodisto) return;
    var luokitus = arvo;

    // nollaa luokitus ja luokitusselite
    angular.forEach($scope.koodit,function(kobj,kkey){
      if ('luokitus' in kobj) {
        delete kobj.luokitus;
        delete kobj.luokitusselite;
      }
    });
    // hae luokitus-koodiston tiedot (koodi arvot ja selitteet)
    var uri = $scope.opintopolkuuri+"/json/"+luokitus+"/koodi"+"?koodistoVersio="+versio+"&onlyValidKoodis=false";
    $http.get(uri).then(function(response){
      $scope.koodiLuokitus = true; // näytä sarakkeet
      $scope.luokitusLataa = true; // näytä spinneri
      $scope.luokituskoodilkm = response.data.length;
      $scope.luokitusladattulkm = 0;
      angular.forEach(response.data, function(lobj,lkey){
        // haetaan luokituksen ylä-/ala-koodit!
        var relaatiouri = "/json/relaatio/sisaltyy-ylakoodit/";
        if ($scope.relaatio=='ala') {
          relaatiouri = "/json/relaatio/sisaltyy-alakoodit/";
        } else if ($scope.relaatio=='sama') {
          relaatiouri = "/json/relaatio/rinnasteinen/";
        }
        var luri = $scope.opintopolkuuri+relaatiouri+lobj.koodiUri;
        $http.get(luri).then(function(nextresponse){
          angular.forEach(nextresponse.data, function(robj,rkey){
            // onko oikean koodiston JA LUONNOS-tilainen (kun tulee kaikki versiot mukaan)
            if (robj.koodisto.koodistoUri == $scope.koodisto && robj.tila=="LUONNOS") {
              if ('luokitus' in $scope.koodit[$scope.kooditindex[robj.koodiUri]]) {
                if ($scope.koodit[$scope.kooditindex[robj.koodiUri]].luokitus.indexOf("*")<0) { // ei vielä duplikaatti
                  $scope.koodit[$scope.kooditindex[robj.koodiUri]].luokitus = "**"; // nyt siis duplikaatti
                } else if ($scope.koodit[$scope.kooditindex[robj.koodiUri]].luokitus.indexOf("*")==0) { // on jo
                  $scope.koodit[$scope.kooditindex[robj.koodiUri]].luokitus += "*";
                }
                $scope.koodit[$scope.kooditindex[robj.koodiUri]].luokitusselite = $scope.koodit[$scope.kooditindex[robj.koodiUri]].luokitus;
              } else {
                $scope.koodit[$scope.kooditindex[robj.koodiUri]].luokitus = lobj.koodiArvo;
                $scope.koodit[$scope.kooditindex[robj.koodiUri]].luokitusselite = getLanguageSpecificValueOrValidValue(lobj.metadata,"nimi","FI");
              }
            }
          });
          console.debug(new Date().toISOString(),"useLuokitus",luokitus,$scope.luokitusladattulkm,lobj.koodiUri,"$http.get done")
          $scope.luokitusladattulkm++;
          if ($scope.luokitusladattulkm >= $scope.luokituskoodilkm) {
            $scope.luokitusLataa = false; // piilota spinneri
            console.debug(new Date().toISOString(),"useLuokitus",luokitus,$scope.luokitusladattulkm,"$http.get ALL DONE")
          }
        });
      });
      //console.debug(new Date().toISOString(),"useLuokitus",luokitus,"$http.get done")
    });
  }

});//-koodiController

// Regular Expression filtering
koodiApp.filter('regex', function() {
  return function(input, regex) {
    //console.debug(input)
    if(!regex) return input;
    //console.debug(regex,Object.keys(regex).length,angular.equals({},regex))
    // clear empty strings away
    angular.forEach(regex,function(value,field){
      if(value==""){
        delete regex[field];
      }
    });
    if(angular.equals({},regex)){//nothing to rule out..
      return input;//..so return all
    }
    // else...
    // start finding matches
    var out = [];
    for(var i=0; i<input.length; i++){
      var addit=true;//see if all patterns give ok
      angular.forEach(regex,function(value,field){
        var patt = new RegExp(value,'i');
        if(!patt.test(input[i][field])){ //if even one says no..
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
