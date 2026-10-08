/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.817, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.85, 500, 1500, "JDBC Request_查询订单状态_轮询"], "isController": false}, {"data": [0.855, 500, 1500, "限价卖"], "isController": false}, {"data": [0.965, 500, 1500, "市价买"], "isController": false}, {"data": [0.765, 500, 1500, "JDBC Request_查询订单状态_首次查询"], "isController": false}, {"data": [0.775, 500, 1500, "JDBC Request_查询相关业务数据"], "isController": false}, {"data": [0.585, 500, 1500, "JDBC Request_查询订单"], "isController": false}, {"data": [0.49, 500, 1500, "限价买"], "isController": false}, {"data": [0.94, 500, 1500, "市价卖"], "isController": false}, {"data": [0.945, 500, 1500, "撤单"], "isController": false}, {"data": [1.0, 500, 1500, "DEBUG_STATUS"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1000, 0, 0.0, 579.8589999999999, 0, 11937, 407.0, 906.5999999999999, 1184.7999999999997, 7443.92000000004, 27.48460861917326, 18.927823270531004, 13.567841461906331], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["JDBC Request_查询订单状态_轮询", 100, 0, 0.0, 382.48, 88, 1544, 196.5, 899.4000000000002, 1168.55, 1543.3199999999997, 4.96746311658636, 0.0436593437981223, 0.0], "isController": false}, {"data": ["限价卖", 100, 0, 0.0, 536.9999999999999, 382, 1235, 446.0, 947.7000000000002, 1149.7499999999998, 1234.61, 4.900039200313603, 4.666904522736181, 4.837831671403371], "isController": false}, {"data": ["市价买", 100, 0, 0.0, 439.07, 381, 1248, 404.5, 462.8, 602.6999999999999, 1245.679999999999, 4.899318994659742, 4.6516737298515505, 4.837120608985351], "isController": false}, {"data": ["JDBC Request_查询订单状态_首次查询", 100, 0, 0.0, 533.56, 93, 2771, 419.5, 1018.5000000000001, 1268.8999999999996, 2765.439999999997, 4.92659375307912, 0.04330014040792197, 0.0], "isController": false}, {"data": ["JDBC Request_查询相关业务数据", 100, 0, 0.0, 523.9800000000002, 109, 3080, 337.0, 923.7, 1438.7999999999981, 3074.9199999999973, 4.640801930573604, 2.084735242249861, 0.0], "isController": false}, {"data": ["JDBC Request_查询订单", 100, 0, 0.0, 1586.4799999999998, 105, 11937, 665.0, 7000.100000000028, 10043.799999999992, 11934.56, 3.1476235442241105, 2.7597650102297764, 0.0], "isController": false}, {"data": ["限价买", 100, 0, 0.0, 894.7499999999998, 799, 1655, 854.0, 1004.2, 1264.7999999999993, 1653.7099999999994, 3.1302823514681024, 3.003634306720716, 3.09054243880298], "isController": false}, {"data": ["市价卖", 100, 0, 0.0, 445.4499999999999, 373, 1262, 403.0, 533.0000000000002, 878.1499999999967, 1259.0899999999986, 4.898359049718344, 4.651049320352682, 4.836172850844967], "isController": false}, {"data": ["撤单", 100, 0, 0.0, 455.7099999999998, 377, 1844, 404.5, 492.1, 594.55, 1843.2599999999995, 4.5909466531998895, 4.363640993710403, 4.532663150766688], "isController": false}, {"data": ["DEBUG_STATUS", 100, 0, 0.0, 0.10999999999999999, 0, 1, 0.0, 1.0, 1.0, 1.0, 4.996752111127767, 3.9060060179633234, 0.0], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1000, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
