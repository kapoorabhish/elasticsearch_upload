$(document).ready(function(){

    $("#csv-input").fileinput({
        'showUpload': false
    });
    
    var rowCount = 0;           //global variable to be used further
    var file_obj = "";         //global variable to be used further
    var ajax_reference = null;
    var abort_parse = false;
    var parser_obj = null;
    function handleFileSelect(evt){
        // var rowCount = 0;
        var file = evt.target.files[0];
        file_obj = file;
    }

    $("#csv-input").change(handleFileSelect);

    $("#csv-input").val("");    //on relaod of page set the value of csv file to empty string.
    $("#header-list").hide();

    function get_url_parts(url)
    {
        var url_parts_regex = /^(https?:\/\/)?(?:(?:(.*):)?(.*?)@)?(.*?)\/(.*)$/;
        var url_parts = url.match(url_parts_regex);
        
        if(url_parts===null)
        {
            return null;
        }

        var scheme_with_slashes = url_parts[1];
        var username = url_parts[2];
        var password = url_parts[3];
        var domain = url_parts[4];


        index_doctype_string = url_parts[5].trim();
        if (index_doctype_string.endsWith("/"))
        {
            index_doctype_string = index_doctype_string.substr(0,index_doctype_string-1);
        }
        
        index_doctype_string_splitted = index_doctype_string.split("/")

        if (!(index_doctype_string_splitted.length==2))
        {
            return null;
        }

        index = index_doctype_string_splitted[0];
        doctype = index_doctype_string_splitted[1];
        
        return {"index":index, "doctype":doctype, "scheme_with_slashes":scheme_with_slashes, "username":username, "password":password, "domain":domain}; 
    }

    function validate_inputs()
    {
        var es_provided=0, csv_provided=0, delimiter_provided=0, chunksize_provided=0;
                    
        var alert_given=0;

        if($("#elastic-connect").val().trim()==="")
        {
            alert("Please provide a Elasticsearch connect string.");
            alert_given=1;
        }
        else{
            if (get_url_parts($("#elastic-connect").val().trim())===null)
            {
                alert("Please provide a valdid Elasticsearch connect string.");
                alert_given=1;
            }
            else
            {
                es_string = $("#elastic-connect").val().trim()   
                es_provided=1;
            }
        }
        
        if($("#csv-input").val().trim()==="" && alert_given==0)
        {
            alert("Please select a csv file.");
            alert_given=1;
        }
        else
            csv_provided=1;

        if( ($("#delimiter").val().trim())===""  && alert_given==0)
        {
            alert("Please provide delimeter.");
            alert_given=1;
        }
        else
            delimiter_provided=1;

        
        var chunk_size_isnum = /^\d+$/.test($("#chunk-size").val().trim());

        if($("#chunk-size").val().trim()===""  && alert_given==0)
        {
            alert("Please provide chunk-size.");
            alert_given=1;
        }
        else if(!chunk_size_isnum)
            alert("Please provide a valid numerical value for chunk-size");
        else
            chunksize_provided=1;


        if(es_provided==1 && csv_provided==1 && delimiter_provided==1 && chunksize_provided==1)
            return true;
        else
            return false;
    }



    $('#select-headers').on('click', function(e) {
        if (validate_inputs()){
            var delimiter=$("#delimiter").val().trim();
            csv_header_arr=[];
            var j=0;
            Papa.parse(file_obj, {
                header:true,
                delimeter: delimiter,
                chunkSize:1024*1024,
                chunk:function(results,parser){
                    csv_header_arr=results.meta['fields'];
                    j+=1;
                    for(i=0;i<csv_header_arr.length;i++)
                    {
                        $("#header-table-body").append(
                                "<tr>"+"<td>"+
                                csv_header_arr[i]+
                                "</td>"+
                                "<td>"+
                                '<input checked data-toggle="toggle" data-on="Yes" data-off="No" type="checkbox">'+
                                "</td>"+
                                "<td>"+
                                '<input data-toggle="toggle" data-on="Yes" data-off="No" type="checkbox">'+
                                "</td>"+
                                "<td>"+
                                '<input type="text" class="form-control" >'+
                                "</td>"+
                                "</tr>"
                            );
                    }
                    $('[data-toggle="toggle"]').bootstrapToggle();
                    parser.abort();
                }

            });
            

            $("#header-list").show();

            var chunk_size_isnum = /^\d+$/.test($("#chunk-size").val().trim());
            if(!chunk_size_isnum)
            {
                alert("Please provide a valid numerical value for chunk-size");
            }
        }
    });
    
    $(".fileinput-remove.fileinput-remove-button").on('click', function(e) {
        $("#header-list").hide();
        }
    );


    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    })


    
    var progressbar = $( "#progressbar" ),
          progressLabel = $( ".progress-label" ),
          dialogButtons = [{
            text: "Cancel Upload",
            click: closeUpload
          }],
          dialog = $( "#dialog" ).dialog({
            autoOpen: false,
            closeOnEscape: false,
            resizable: false,
            buttons: dialogButtons,
            modal: true,
            open: function() {
                progress();
            },
            beforeClose: function() {
              $("#upload").button( "option", {
                disabled: false,
                label: "Upload"
              });
            }
          })


    $("#upload").on("click",function(event){
        $( this ).button( "option", {
                    disabled: true,
                    modal: true,
                    label: "Uploading..."
                  });
        dialog.dialog( "open" );
        
    });

    progressbar.progressbar(
        {
            value: false,
            change: function() {
                progressLabel.text( "Upload Progress: " + progressbar.progressbar( "value" ) + "%" );
            },
            complete: function() {
                progressLabel.text( "Complete!" );
                dialog.dialog( "option", "buttons", [{
                    text: "Close",
                    click: closeUpload
                }]);
            $(".ui-dialog button").last().trigger( "focus" );
          }
                        });

    function closeUpload()
    {
        abort_parse = true;
        ajax_reference.abort();
        dialog
            .dialog( "option", "buttons", dialogButtons )
            .dialog( "close" );
            progressbar.progressbar( "value", false );
            progressLabel
            .text( "Starting upload..." );
            $("#upload").trigger( "focus" );
        

    }

    var x = 0;
    function progress()
    {
        var chunk_size = parseInt($("#chunk-size").val().trim());
        var posted_object_arr = [];
        var delimiter=$("#delimiter").val().trim();
        var url_parts_obj = get_url_parts($("#elastic-connect").val().trim());
        var index_name = url_parts_obj.index;
        var doctype = url_parts_obj.doctype;
        var scheme_with_slashes = url_parts_obj.scheme_with_slashes;
        var username = url_parts_obj.username;
        var password = url_parts_obj.password;
        var domain_with_port = url_parts_obj.domain;
        var url = scheme_with_slashes+domain_with_port+"/"+index_name+"/_bulk";
        var post_cycle = 0;
        var num_cycles = 1;
        var percent_done = 0;
        if (file_obj.size>(1024*chunk_size))
        {
            num_cycles = Math.ceil(file_obj.size/(1024*chunk_size));
        }

        Papa.parse(file_obj, {
                header:true,
                delimeter: delimiter,
                chunkSize:1024*chunk_size,
                skipEmptyLines:true,
                dynamicTyping: true,
                chunk:function(results,parser){
                    parser_obj = parser;
                    var post_arr = [];
                    x+=results.data.length;
                    for(i=0;i<results.data.length;i++)
                    {
                        var conf_onj = { "index" : { "_index" : index_name, "_type" : doctype } };
                        post_arr.push(JSON.stringify(conf_onj));
                        post_arr.push(JSON.stringify(results.data[i]));
                    }

                    ajax_reference = $.ajax({
                        url:url,
                        data:post_arr.join("\n")+"\n", //append "\n" in last
                        type : "POST",
                        crossDomain : true,
                        dataType: "text",
                        async: false,
                        error: function(e) {
                            console.log(e);
                        },
                        success:function(response){
                            console.log("helo");
                            console.log(abort_parse);
                            post_cycle += 1;
                            if(post_cycle >= num_cycles)
                            {
                                percent_done = 100;
                            }
                            else
                            {
                                percent_done = Math.floor((post_cycle/num_cycles)*100);
                            }
                            progressbar.progressbar( "value", percent_done);


                        }
                    });
                
                    if (abort_parse===true){
                        parser.abort();
                        abort_parse=false;
                    }

                    
                }

            });
    }

});
