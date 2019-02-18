//var gun = Gun('https://webareaekasa.github.io');
var gun = Gun();
//var points = {};

  $(function() {

    gun.get('mark').put({
        name: "Mark",
        email: "mark@gunDB.io",
      });
      
      gun.get('mark').on(function(data, key){
        console.log("update:", data);
      });

    // gun.get('points').on(function(data, key){
    // console.log("update:", data);
    // //points = data;
    // });

    // function addPoint(){
    //     var newNumber = 0;
    //     if(points.number){
    //         newNumber = points.number + 1;
    //     }
        
    //     var objToAdd = {
    //         number: newNumber
    //     };

    //     gun.get('points').put(objToAdd);
    // }

    $( "#addBtn" ).on( "click", function() {
        gun.get('mark').put({
            name: "Pepe",
            email: "mark@gunDB.io",
          });
    });
});
