(function(){
    var pusher = new Pusher('952a3f06df25a830cc87');
    var channel = pusher.subscribe('macbook');

    var rest = function(){
       $(document).ready(function(){
          $('.msg').html("is resting");
          $('.msg').attr('title','No CPU usage right now');
          $('.cpu').html("");
          $('.percent').html("");
       });
    };

    var working = function(data){
       $(document).ready(function(){
          $('.msg').html('is working at');
          $('.msg').attr('title','Units: percentage of CPU');
          $('.cpu').html(data);
          $('.percent').html("%");
       });
    };

    var activity = function(data){
       $(document).ready(function(){
          $('.msg').html(data.msg||"?");
          $('.msg').attr('title','');
          $('.cpu').html("");
          $('.percent').html("");
       });
    };

    var tid = null,
        doingActivity = false;

    tid = setTimeout(rest,5000);
    channel.bind('cpu', function(data) {
       if(!doingActivity){
         if(tid) clearTimeout(tid);
         tid = setTimeout(rest,5000);
         working(data);
       }
    });

    channel.bind('activity', function(data){
        doingActivity=true;
        if(tid) clearTimeout(tid);
        setTimeout(function(){
           doingActivity=false;
           rest();
        },data.timeout||1);
        activity(data);
    });

    $.ajax({
        url : 'activity',
        dataType : 'json',
        success : function(data){
          doingActivity=true;
          if(tid) clearTimeout(tid);
          setTimeout(function(){
            doingActivity=false;
            rest();
          },data.timeout||1);
          activity(data);
        },
        error : function(res,status,err){
         // console.warn(err);
        }
    });
})();
