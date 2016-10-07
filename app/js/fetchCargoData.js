var fetchCargoData = (function(){

    var apikey = "AIzaSyAFLzyniNxXIFr1Pd_sVKgI5LrYyemH2wM",                    
        spreadsheetId = "1-AIUwEL-MjVDNxZeR6wlBLsnw2zxeU7k1lC_28ONqQI",
        sheet = "CargoData!",
        range = "A1:J10",
        url = "https://sheets.googleapis.com/v4/spreadsheets/"+ spreadsheetId +"/values/"+ sheet + range + "?key="+ apikey +"&alt=json",
        cargoData,
        cargoDataHeader,
        cargoDataFinal = [];

    function init(){
        console.log('inside init');
        retrieveAllData();
    }

    function retrieveAllData(){
        console.log('inside retrieveAllData:');
        $.ajax({
            url: url,
            success: function(data) {
                cargoData = data.values;
                console.log('cargoData:', cargoData);
                
                cargoDataHeader = cargoData[0];

                for(i=1; i<cargoData.length; i++){
                    console.log(_.zipObject(cargoDataHeader, cargoData[i]));
                    var tempObj = _.zipObject(cargoDataHeader, cargoData[i]);
                    cargoDataFinal.push(tempObj);
                }

                cargoApp.cargo = cargoDataFinal;
                cargoApp.init();
            },
        });
    }

    //lookup(001)
    function lookup(lookupPrefix){
        var lookupIndex = _.findIndex(cargoDataFinal, {airline: lookupPrefix });
        console.log('full object:', cargoDataFinal[lookupIndex]);
    }

    return{
        init:init,
        retrieveAllData: retrieveAllData,
        lookup: lookup,
        cargoDataFinal: cargoDataFinal
    }

}(fetchCargoData));

fetchCargoData.init();