
//create TileLayer
var tile_x=new ol.layer.Tile({
  source: new ol.source.OSM()
});
var vector;
var wkt = new ol.format.WKT();
const source = new ol.source.Vector();
var extent_x=[];

var extent_y=[];
var extent=[];
 vector = new ol.layer.Vector({  
  source: source,
  //create shape of point and color of point
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
    stroke: new ol.style.Stroke({
      color: '#ffcc33',
      width: 2,
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: '#ffcc33',
      }),
    }),
  }),
});



var wkt_drawend;
//map i oluşturuyoruz.
var map = new ol.Map({
  //htmlde  div kısmındaki id kısmını tanımlıyoruz.
  target: 'map',
  /*layerları eklediğimiz kısım.TileLayer=döşeme halinde düşünülebilir zoom yapıldıkça tilelayerımız farklı png e kayar.VectorLayer:Müşteri tarafındaki datayı işlemeye 
  yardımcı olur.*/
  layers: [tile_x,vector],
  //zoom işlemi center belirleme ve projeksiyon için kullanılır.default olarak EPSG:3857 olarak ayarlanıyor.
  view: new ol.View({
    center:[37.94729012167923 ,39.41599548234691],
    zoom: 6,
    projection: 'EPSG:4326',
  })
});





var draw; 
const typeSelect=document.getElementById('type');
if(typeSelect==null){
  typeSelect.value='Point';
}
draw_function();
var modal = document.getElementById("myModal");
var ekle_button=document.getElementById("BTN");
var update_modal=document.getElementById("update_modal");
$(document).ready(function(){
  var max_x;
  var min_x;
  var max_y;
  var min_y;

  $.ajax({
    url: 'https://localhost:44382/api/location',
    dataType: 'json',
    type: 'get',
    contentType: 'application/json',
    data:{"data":"check"},
    success: function(data){
      for (var i in data){
        insert_function_ontable(data[i].id,data[i].wkt,data[i].sehir,data[i].ilce);
        var draw_wkt=data[i].wkt;
        var format = new ol.format.WKT();
        var feature = format.readFeature(draw_wkt, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:4326',
        });
       source.addFeature(feature);
       feature.id=data[i].id;
       feature.sehir=data[i].sehir;
       feature.ilce=data[i].ilce;
       extent_x.push(feature.getGeometry().flatCoordinates[0]);
       extent_y.push(feature.getGeometry().flatCoordinates[1]);
       
    } 
    max_x=Math.max(...extent_x);
    min_x=Math.min(...extent_x);
    max_y=Math.max(...extent_y);
    min_y=Math.min(...extent_y);
    extent.push(min_x);
    extent.push(min_y);
    extent.push(max_x);
    extent.push(max_y);
    map.getView().fit(extent, map.getSize());
   
  }
});
});
var modify = new ol.interaction.Modify({source: source});
map.addInteraction(modify);

var snap;

var span = document.getElementsByClassName("close")[0];
typeSelect.onchange = function () {
  
  map.removeInteraction(draw);
  draw_function();
  
};

function draw_function() {
  draw = new ol.interaction.Draw({
      source: source  ,
      type: typeSelect.value,
  }); 
map.addInteraction(draw);
snap= new ol.interaction.Snap({
  source:source,
});
map.addInteraction(snap);





 draw.on('drawend',function(evt){ 
      feature_=evt.feature;
      wkt_drawend=wkt.writeFeature(evt.feature);
      modal.style.display = "block";
      
      ekle_button.onclick=function(){
        var sehir=document.getElementById("fname").value;
        var ilce =document.getElementById("lname").value;
        feature_.sehir=sehir;
        feature_.ilce=ilce;
        
        post(feature_,wkt_drawend,sehir,ilce);
       
        modal.style.display = "none";
        insert_function_ontable(feature_.id,wkt_drawend,sehir,ilce,update_modal);
        document.getElementById("fname").value=" ";
        document.getElementById("lname").value=" ";

      }

  });
}


modify.on('modifyend',function(evt){
  wkt_modify=evt.features.getArray()[0];
 console.log(wkt_modify.id);
  ajax_update(wkt_modify.id,wkt.writeFeature(wkt_modify),wkt_modify.sehir,wkt_modify.ilce);
  var tb=document.getElementById('table');
  while(tb.rows.length > 1) {
    tb.deleteRow(1);
  }
  get();
  
});



function log_deneme(){
 
}
span.onclick = function() {
  modal.style.display = "none";
  update_modal.style.display="none";
}
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
    update_modal.style.display="none";
  }
}
//row insert
function insert_function_ontable(id,wkt_drawend,sehir,ilce){
  var table = document.getElementById("table");
  var btn = document.createElement('input');
  var btn_update=document.createElement('input');
  
  btn_update.id="UPDATE";
  btn_update.type="button";
  btn_update.value="U";
  btn.id="DELETE";
  btn.type="button";
  btn.value="X";
  var row = table.insertRow(1);
  row.id=wkt_drawend;
  var cell1 = row.insertCell(0);
  var cell2 = row.insertCell(1);
  var cell3=row.insertCell(2);
  var cell4=row.insertCell(3);
  var cell5=row.insertCell(4);
  cell1.innerHTML= sehir;
  cell2.innerHTML= ilce;
  cell3.innerHTML=wkt_drawend;
  cell4.appendChild(btn); 
  cell5.appendChild(btn_update);
  
  delete_button(id,wkt_drawend,sehir,ilce,table);

  update_button(id,wkt_drawend,sehir,ilce);
}
///BUTTONS
function delete_button(id,wkt_drawend,sehir,ilce,){
  var button=document.getElementById("DELETE");
  var new_wkt_drawend=wkt_drawend;
  var new_sehir=sehir;
  var new_ilce=ilce;

  button.onclick=function deneme(){
    var row=document.getElementById(wkt_drawend);
    row.parentNode.removeChild(row);
    ajax_delete(id,new_wkt_drawend,new_sehir,new_ilce);
    var features=source.getFeatures();
    for (var i in features){
      if(features[i].id==id){
        source.removeFeature(features[i]);
      }
    }
  }

}
function update_button(id,wkt_drawend,sehir,ilce){
  var button_up=document.getElementById("UPDATE");
  var update_modal=document.getElementById('update_modal');
  button_up.onclick=function(){
    document.getElementById("güncel_sehir").value=sehir;
    document.getElementById("güncel_ilce").value=ilce;
    update_modal.style.display = "block";
    var upbtn=document.getElementById("upbtn"); 
    upbtn.onclick=function(){
      var wkt_new=wkt_drawend;
      var update_sehir=document.getElementById("güncel_sehir").value;
      var update_ilce =document.getElementById("güncel_ilce").value;
      ajax_update(id,wkt_new,update_sehir,update_ilce);
      update_modal.style.display = "none";
      var x = document.getElementById("table").rows[wkt_new].cells;
      x[0].innerHTML=update_sehir;
      x[1].innerHTML=update_ilce
    }
  }
  


}
function close_op(){
  update_modal.style.display = "none";
}


//ajax
function post(feature,wkt_drawend,sehir,ilce){
  
  $.ajax({
    url: 'https://localhost:44382/api/location',
    dataType: 'json',
    type: 'post',
    contentType: 'application/json',
    data: JSON.stringify({'wkt':wkt_drawend,'sehir':sehir,'ilce':ilce}),
    success: function(data){
      feature.id=data;
    },
});

}
function ajax_delete(id,new_wkt_drawend,new_sehir,new_ilce){
  $.ajax({
    url: 'https://localhost:44382/api/location',
    dataType: 'json',
    type: 'delete',
    contentType: 'application/json',
    data: JSON.stringify({'id':id,'wkt':new_wkt_drawend,'sehir':new_sehir,'ilce':new_ilce}),
    success: log_deneme,
}); 
  

}
function ajax_update(id,new_wkt_drawend,new_sehir,new_ilce){
  $.ajax({

    url: 'https://localhost:44382/api/location/update',
    dataType: 'json',
    type: 'post',
    contentType: 'application/json',
    data: JSON.stringify({'id':id,'wkt':new_wkt_drawend,'sehir':new_sehir,'ilce':new_ilce}),
    success: log_deneme,
    
});
alert("WKT GÜNCELLENDİ.");
}

function get(){
  $.ajax({
    url: 'https://localhost:44382/api/location',
    dataType: 'json',
    type: 'get',
    contentType: 'application/json',
    data:{"data":"check"},
    success: function(data){
      for (var i in data){
        insert_function_ontable(data[i].id,data[i].wkt,data[i].sehir,data[i].ilce);
    } 
  }
});
}
