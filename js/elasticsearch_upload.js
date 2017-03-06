$(document).ready(function(){

    $("#csv-input").fileinput({
        'showUpload': false
    });
    
    var rowCount = 0;           //global variable to be used further
    var file_obj = "";         //global variable to be used further

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


    $("#upload").on("click",function(event){
        var chunk_size = parseInt($("#chunk-size").val().trim());
        var posted_object_arr = [];
        var delimiter=$("#delimiter").val().trim();
        
        Papa.parse(file_obj, {
                header:true,
                delimeter: delimiter,
                chunkSize:1024*chunk_size,
                skipEmptyLines:true,
                chunk:function(results,parser){
                    console.log(results) ;               
                }

            });
        
    });



});
