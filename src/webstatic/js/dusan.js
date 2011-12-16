var guid=0;
var game_name;

$(document).ready(function(){
    $.ajaxSetup({ cache: false });

    $('#brdimg').click(function(e){
	sendCoords(e,$(this));
    });
    $('#sg123').click(function(e){
	$.post("startgame",{game_name:"tictactoe"}, function(data){
	    var jData=$.parseJSON(data);
	    game_name=jData.game_name;
	    guid=jData.guid;
	}
	      );
    });
    loadSymbols();
    longpoll();
    //necu na init da stavim da mi se stranica postavi sa igru koju sam igrao, nego ca da postavim listu sa aktivnim igrama i igrama koje posmatram , pa ce on sam da odabere.
});

$(window).load(function (e){
    $.board = {
	xsize:$('#brdimg').width(),
	ysize:$('#brdimg').height()
    };
});

function loadSymbols(){
    $.post("gamedef",{game_name:"tictactoe"}, function(data){
	$.symbols=$.parseJSON(data);
    });
}

function sendCoords(e,t){
    var x=e.pageX - t.offset().left;
    var y=e.pageY - t.offset().top;

    var xrel=x/$.board.xsize;
    var yrel=y/$.board.ysize;
    $.ajax({
	type: "POST",
        cache: false,
	url:"tictactoe",
	data:{xcoord:xrel, ycoord:yrel},
	sucess: function(d){
	},
	error: function(XMLHttpRequest, textStatus, errorThrown){
	    alert("Error in response"+textStatus+":"+errorThrown);
	}
    });
    
}

function displayField(data){
    //if (guid==0){
//	return;
  //  }
    //var jData=$.parseJSON(data);
    var xField=data.xfield;
    var yField=data.yfield;
    var symbol=data.picsym;
    var symbolURL=$.symbols[symbol];
    var xDraw=xField* ($.board.xsize/3);
    var yDraw=yField* ($.board.ysize/3);
    $("#polje_"+xField+"_"+yField).remove();
    obja=$("<div id='polje_"+xField+"_"+yField+"'> <img id='figimg' class='displayed' src='"+symbolURL+"' /> </div>");
    $("#igra").append(obja.css(
	{'width':($.board.xsize/3)+'px', 'height':($.board.ysize/3)+'px','position':'absolute','z-index':'1', 'left':(xDraw+'px'), 'top':(yDraw+'px')}
    ));
}

function prJSON(data){
    var str="";
    for (var key in data){
	str+=key+":"+data[key]+" ";
    }
    return str;
}
function  longpoll (){
    $.ajax({
	type: "GET",
	url: "longpoll",
	data:{game_uid:guid},
	async: true,
	cache: false,
	timeout:50000, /* Timeout in ms */

	success: function(d){
		alert(d);
	    var jData=$.parseJSON(d);
	    for (var key in jData){
		if (key=="invitations"){
		    printInvitations (jData[key]);
		}
		if (key=="fieldsout"){
		    displayField (jData[key]);
		}
		if (key=="invalid_move"){
		    invalidMove(jData[key]);
		}
		if (key=="event"){
		    displayEvent(jData[key]);
		}
	    }
	    longpoll();
	},
	error: function(XMLHttpRequest, textStatus, errorThrown){
	    longpoll();
	}
    });
}

function invalidMove(message){
    alert("Invalid move "+prJSON(message));
}

function displayEvent(message){
    //alert(prJSON(message));
}


function joinGame(sGameName,sGameUid){
    /*
      Ovde se prakticno podrazumeva da je igra pocela 
      za igre sa 2 igraca. Za igre sa vise igraca to ce biti tacno kada se 
      svi prikljuce
    */
    guid=sGameUid;
    game_name=sGameName;
    $.post("joingame",{game_name:sGameName, game_uid:sGameUid},
	   function(data){
	       $("igra").show();
	   });
}

function printInvitations(data){
    //var jData=$.parseJSON(data);
    var invitations="";
    for (var prop in data){
	var val=data[prop];
	invitations+="<a href=# onclick='joinGame(\"tictactoe\",\""+prop+"\");'>"+val+"</a><br/>";
    }
    $("#opengames").html(invitations);
    
}



