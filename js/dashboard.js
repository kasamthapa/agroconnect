var pivot = new Flexmonster({
    container: "#pivot-container",
    componentFolder: "https://cdn.flexmonster.com/",
    licenseFilePath: "https://cdn.flexmonster.com/codepen.key",
    width: 700,
    height: 350,
    toolbar: true,
    report: {
        dataSource: {
            data: getData()
        },
        "slice": {
        "rows": [
            {
                "uniqueName": "City", "filter": {
                   "measure": {
                       "uniqueName": "Revenue"
                   },
                   "query": {
                       "top": 5
                   }
               }
              
            }
        ],
        "columns": [
            {
                "uniqueName": "[Measures]"
            }
        ],
        "measures": [
             {
                    "uniqueName": "Revenue",
                    "formula": "sum(\"Amount\") * sum(\"Price\")",
                    "individual": true,
                    "format": "currency",
                    "caption": "Revenue"
                }
      
        ]
    }, 
      "conditions": [
        {
            "formula": "#value < 6000",
            "measure": "Treatment Cost",
            "format": {
                "backgroundColor": "#29c3be",
                "color": "#000000",
                "fontFamily": "Arial",
                "fontSize": "12px"
            },
            "isTotal": false
        },
        {
            "formula": "#value > 12000",
            "measure": "Treatment Cost",
            "format": {
                "backgroundColor": "#f2726f",
                "color": "#000000",
                "fontFamily": "Arial",
                "fontSize": "12px"
            },
            "isTotal": false
        }
    ],
    "formats": [
        {
            "name": "currency",
            "currencySymbol": "$"
        },
        {
          "name": "",
          "decimalPlaces": 2
        }
    ]
    },
  reportcomplete: function() {
    pivot.off("reportcomplete");
    createAreaChart();
    createAreaChart2();
    createDoughnutChart();
    createColumnChart();
    createMarimekkoChart();
  }
});

function createAreaChart() {
	var chart = new FusionCharts({
		"type": "area2d",
		"renderAt": "areachartContainer",
    "width": 550,
    "height":350
    
	});

	pivot.fusioncharts.getData({
    	type: chart.chartType(), "slice": {
        "rows": [
            {
                "uniqueName": "Order Date.Year"
            }
        ],
        "columns": [
            {
                "uniqueName": "[Measures]"
            }
        ],
        "measures": [
            {
                "uniqueName": "Orders",
                "aggregation": "sum"
            }
        ]
    }
	}, function(data) {
    data.chart.xAxisName = undefined;
    data.chart.yAxisName = undefined;
    data.chart.theme = "fusion"; // apply the FusionCharts theme
    data.chart.plotToolText = "$label<br> Orders: $value";
    data.chart.caption = "Overall Number of Orders";
    data.chart.subcaption = "by Years";
		chart.setJSONData(data);
		chart.render();
	}, function(data) {
    data.chart.xAxisName = undefined;
    data.chart.yAxisName = undefined;
    data.chart.theme = "fusion"; // apply the FusionCharts theme
    data.chart.plotToolText = "$label<br> Orders: $value";
    data.chart.caption = "Overall Number of Orders";
    data.chart.subcaption = "by Years";
		chart.setJSONData(data);
	});
}

function createAreaChart2() {
	var chart = new FusionCharts({
		"type": "area2d",
		"renderAt": "areachartContainer-2",
    "width": 550,
    "height":350
    
	});

	pivot.fusioncharts.getData({
    	type: chart.chartType(), "slice": {
        "rows": [
            {
                "uniqueName": "Order Date.Month"
            }
        ],
        "columns": [
            {
                "uniqueName": "[Measures]"
            }
        ],
        "measures": [
            {
                "uniqueName": "Orders",
                "aggregation": "average"
            }
        ]
    }
	}, function(data) {
    data.chart.xAxisName = undefined;
    data.chart.yAxisName = undefined;
    data.chart.theme = "fusion"; // apply the FusionCharts theme
    data.chart.plotToolText = "$label<br> Orders: $value";
    data.chart.caption = "Average Number of Orders";
    data.chart.subcaption = "by Months";
		chart.setJSONData(data);
		chart.render();
	}, function(data) {
    data.chart.xAxisName = undefined;
    data.chart.yAxisName = undefined;
    data.chart.theme = "fusion"; // apply the FusionCharts theme
    data.chart.plotToolText = "$label<br> Orders: $value";
    data.chart.caption = "Average Number of Orders";
    data.chart.subcaption = "by Months";
		chart.setJSONData(data);
	});
}


function createDoughnutChart() {
	var chart = new FusionCharts({
		"type": "doughnut2d",
		"renderAt": "doughnut2dContainer",
    "width": 550,
    "height": 350
	});

	pivot.fusioncharts.getData({
    	type: chart.chartType()
	}, function(data) {
    data.chart.theme = "fusion"; // apply the FusionCharts theme
    data.chart.caption = "Top Cities";
    data.chart.subcaption = "by Revenue";
		chart.setJSONData(data);
		chart.render();
	}, function(data) {
    data.chart.theme = "fusion"; // apply the FusionCharts theme
    data.chart.caption = "Top Cities";
    data.chart.subcaption = "by Revenue";
		chart.setJSONData(data);
	});
}

function createColumnChart() {
	var chart = new FusionCharts({
		"type": "column2d",
		"renderAt": "columnContainer",
    "width": 600,
    "height": 300
	});

	pivot.fusioncharts.getData({
    	type: chart.chartType(), "slice": {
        "rows": [
            {
                "uniqueName": "Referring Site",
                "filter": {
                    "measure": {
                        "uniqueName": "Orders"
                    },
                    "query": {
                        "top": 6
                    }
                }
            }
        ],
        "columns": [
            {
                "uniqueName": "[Measures]"
            }
        ],
        "measures": [
            {
                "uniqueName": "Orders",
                "aggregation": "sum"
            }
        ],
        "sorting": {
            "column": {
                "type": "desc",
                "tuple": [],
                "measure": {
                    "uniqueName": "Orders",
                    "aggregation": "sum"
                }
            }
        }
    }
	}, function(data) {
    data.chart.theme = "fusion"; // apply the FusionCharts theme
    data.chart.caption = "Top 5 Referring Websites";
    data.chart.yAxisName = undefined;
    data.chart.subcaption = "by Orders";
		chart.setJSONData(data);
		chart.render();
	}, function(data) {
    data.chart.theme = "fusion"; // apply the FusionCharts theme
    data.chart.caption = "Top 5 Referring Websites";
    data.chart.yAxisName = undefined;
    data.chart.subcaption = "by Orders";
		chart.setJSONData(data);
	});
}

function createMarimekkoChart() {
	var chart = new FusionCharts({
		"type": "marimekko",
		"renderAt": "marimekkoChartContainer",
    "width": 600,
    "height": 300
	});

	pivot.fusioncharts.getData({
    	type: chart.chartType(), "slice": {
        "rows": [
            {
                "uniqueName": "Payment Type"
            }
        ],
        "columns": [
          {
                "uniqueName": "Referring Site",
                "filter": {
                    "measure": {
                        "uniqueName": "Orders"
                    },
                    "query": {
                        "top": 3
                    }
                }
            },
            {
                "uniqueName": "[Measures]"
            }
        ],
        "measures": [
            {
                "uniqueName": "Orders",
                "aggregation": "sum"
            }
        ],
        "sorting": {
            "column": {
                "type": "desc",
                "tuple": [],
                "measure": {
                    "uniqueName": "Orders",
                    "aggregation": "sum"
                }
            }
        }
    }
	}, function(data) {
    data.chart.theme = "fusion"; // apply the FusionCharts theme
    data.chart.caption = "Top 3 Payment Types";
    data.chart.yAxisName = undefined;
		chart.setJSONData(data);
		chart.render();
	}, function(data) {
    data.chart.theme = "fusion"; // apply the FusionCharts theme
    data.chart.caption = "Top 3 Payment Types";
    data.chart.yAxisName = undefined;
		chart.setJSONData(data);
	});
}


function getData() {
  return [
    {   "Age": {"type":"number"},   "Order Date": {"type":"date"},   "City": {"type":"string"},   "Amount": {"type":"number"},   "Price": {"type":"number"},   "Payment Type": {"type":"string"},   "Referring Site": {"type":"string"},   "Orders": {"type":"number"},   "Name": {"type":"string"} },
 
 {   "Age": 59,   "Order Date": "9/28/2007",   "City": "Prague",   "Amount": 510,   "Price": 60,   "Payment Type": "Bitcoin",   "Referring Site": "Facebook",   "Orders": 871,   "Name": "Eleanor" },
 {   "Age": 53,   "Order Date": "9/29/2005",   "City": "Prague",   "Amount": 132,   "Price": 10,   "Payment Type": "Cash on delivery",   "Referring Site": "Facebook",   "Orders": 397,   "Name": "Daniel" },
 {   "Age": 44,   "Order Date": "12/24/2001",   "City": "Vienna",   "Amount": 486,   "Price": 43,   "Payment Type": "Cash on delivery",   "Referring Site": "Facebook",   "Orders": 506,   "Name": "Eliza" },
 {   "Age": 61,   "Order Date": "8/30/2001",   "City": "Vienna",   "Amount": 411,   "Price": 29,   "Payment Type": "Cash on delivery",   "Referring Site": "eBay",   "Orders": 560,   "Name": "Jordan" },
 {   "Age": 28,   "Order Date": "5/24/2005",   "City": "Vienna",   "Amount": 667,   "Price": 71,   "Payment Type": "Bitcoin",   "Referring Site": "eBay",   "Orders": 197,   "Name": "Linnie" },
 {   "Age": 25,   "Order Date": "3/12/2005",   "City": "Tokyo",   "Amount": 186,   "Price": 28,   "Payment Type": "Cash on delivery",   "Referring Site": "eBay",   "Orders": 987,   "Name": "Lois" },
 {   "Age": 42,   "Order Date": "4/29/2005",   "City": "Tokyo",   "Amount": 43,   "Price": 9,   "Payment Type": "Bitcoin",   "Referring Site": "Facebook",   "Orders": 402,   "Name": "Mason" },
 {   "Age": 62,   "Order Date": "4/20/2003",   "City": "Tokyo",   "Amount": 66,   "Price": 6,   "Payment Type": "Bitcoin",   "Referring Site": "Facebook",   "Orders": 393,   "Name": "Georgie" },
 {   "Age": 27,   "Order Date": "3/29/2000",   "City": "Tokyo",   "Amount": 295,   "Price": 48,   "Payment Type": "Bitcoin",   "Referring Site": "Facebook",   "Orders": 161,   "Name": "Louise" },
 {   "Age": 59,   "Order Date": "12/9/2003",   "City": "Tokyo",   "Amount": 624,   "Price": 4,   "Payment Type": "Bitcoin",   "Referring Site": "Facebook",   "Orders": 387,   "Name": "Rebecca" },
 {   "Age": 62,   "Order Date": "9/20/2003",   "City": "Vienna",   "Amount": 480,   "Price": 48,   "Payment Type": "Cash on delivery",   "Referring Site": "eBay",   "Orders": 960,   "Name": "Tom" },
 {   "Age": 28,   "Order Date": "2/20/2000",   "City": "Tokyo",   "Amount": 513,   "Price": 5,   "Payment Type": "Bitcoin",   "Referring Site": "eBay",   "Orders": 591,   "Name": "Bernice" },
 {   "Age": 21,   "Order Date": "11/25/2003",   "City": "Tokyo",   "Amount": 443,   "Price": 49,   "Payment Type": "Bitcoin",   "Referring Site": "eBay",   "Orders": 400,   "Name": "Cecelia" },
 {   "Age": 20,   "Order Date": "10/9/2006",   "City": "Vienna",   "Amount": 322,   "Price": 83,   "Payment Type": "Cash on delivery",   "Referring Site": "Facebook",   "Orders": 659,   "Name": "Joe" },
 {   "Age": 38,   "Order Date": "12/8/2006",   "City": "Tokyo",   "Amount": 175,   "Price": 25,   "Payment Type": "Bitcoin",   "Referring Site": "eBay",   "Orders": 42,   "Name": "Gene" },
 {   "Age": 32,   "Order Date": "6/26/2000",   "City": "Tallinn",   "Amount": 740,   "Price": 97,   "Payment Type": "Cash on delivery",   "Referring Site": "Apps",   "Orders": 931,   "Name": "Gilbert" },
 {   "Age": 23,   "Order Date": "8/17/2005",   "City": "Mumbai",   "Amount": 883,   "Price": 91,   "Payment Type": "Bitcoin",   "Referring Site": "Apps",   "Orders": 706,   "Name": "Fanny" },
 {   "Age": 29,   "Order Date": "2/18/2008",   "City": "Tallinn",   "Amount": 373,   "Price": 22,   "Payment Type": "Bitcoin",   "Referring Site": "Etsy",   "Orders": 31,   "Name": "Mable" },
 {   "Age": 54,   "Order Date": "11/7/2008",   "City": "Mumbai",   "Amount": 177,   "Price": 90,   "Payment Type": "Cash on delivery",   "Referring Site": "Etsy",   "Orders": 69,   "Name": "Leonard" },
 {   "Age": 25,   "Order Date": "1/24/2008",   "City": "Tallinn",   "Amount": 763,   "Price": 83,   "Payment Type": "Bitcoin",   "Referring Site": "Etsy",   "Orders": 868,   "Name": "Cordelia" },
 {   "Age": 28,   "Order Date": "8/26/2008",   "City": "Tallinn",   "Amount": 770,   "Price": 12,   "Payment Type": "Cash on delivery",   "Referring Site": "eBay",   "Orders": 186,   "Name": "Antonio" },
 {   "Age": 33,   "Order Date": "3/4/2002",   "City": "Tallinn",   "Amount": 526,   "Price": 97,   "Payment Type": "Cash on delivery",   "Referring Site": "Etsy",   "Orders": 344,   "Name": "Juan" },
 {   "Age": 46,   "Order Date": "9/12/2002",   "City": "Mumbai",   "Amount": 681,   "Price": 63,   "Payment Type": "Cash on delivery",   "Referring Site": "eBay",   "Orders": 665,   "Name": "Pauline" },
 {   "Age": 56,   "Order Date": "2/22/2005",   "City": "Tallinn",   "Amount": 867,   "Price": 73,   "Payment Type": "Cash on delivery",   "Referring Site": "eBay",   "Orders": 9,   "Name": "Eula" },
 {   "Age": 44,   "Order Date": "2/22/2009",   "City": "Mumbai",   "Amount": 868,   "Price": 23,   "Payment Type": "Cash on delivery",   "Referring Site": "eBay",   "Orders": 314,   "Name": "Jerry" },
 {   "Age": 51,   "Order Date": "10/10/2001",   "City": "Tallinn",   "Amount": 993,   "Price": 93,   "Payment Type": "Cash on delivery",   "Referring Site": "Google",   "Orders": 154,   "Name": "Mario" },
 {   "Age": 48,   "Order Date": "12/19/2004",   "City": "Mumbai",   "Amount": 158,   "Price": 78,   "Payment Type": "Bitcoin",   "Referring Site": "Google",   "Orders": 733,   "Name": "Louise" },
 {   "Age": 43,   "Order Date": "12/5/2000",   "City": "Tallinn",   "Amount": 492,   "Price": 48,   "Payment Type": "Bitcoin",   "Referring Site": "Etsy",   "Orders": 229,   "Name": "Lawrence" },
 {   "Age": 42,   "Order Date": "2/25/2000",   "City": "Mumbai",   "Amount": 156,   "Price": 7,   "Payment Type": "Cash on delivery",   "Referring Site": "Google",   "Orders": 110,   "Name": "Jean" },
 {   "Age": 33,   "Order Date": "8/9/2000",   "City": "Mumbai",   "Amount": 872,   "Price": 45,   "Payment Type": "Cheque",   "Referring Site": "Google",   "Orders": 120,   "Name": "Eula" },
 {   "Age": 65,   "Order Date": "6/28/2002",   "City": "Tallinn",   "Amount": 917,   "Price": 86,   "Payment Type": "Cash on delivery",   "Referring Site": "Etsy",   "Orders": 424,   "Name": "Connor" },
 {   "Age": 24,   "Order Date": "8/8/2007",   "City": "Mumbai",   "Amount": 914,   "Price": 90,   "Payment Type": "Cash on delivery",   "Referring Site": "Google",   "Orders": 807,   "Name": "Johnny" },
 {   "Age": 31,   "Order Date": "5/22/2008",   "City": "Vancouver",   "Amount": 463,   "Price": 59,   "Payment Type": "Cash on delivery",   "Referring Site": "Google",   "Orders": 826,   "Name": "Evan" },
 {   "Age": 46,   "Order Date": "7/9/2003",   "City": "Mumbai",   "Amount": 861,   "Price": 86,   "Payment Type": "Cheque",   "Referring Site": "Etsy",   "Orders": 931,   "Name": "Alejandro" },
 {   "Age": 40,   "Order Date": "8/27/2007",   "City": "Vancouver",   "Amount": 997,   "Price": 17,   "Payment Type": "Cash on delivery",   "Referring Site": "Etsy",   "Orders": 219,   "Name": "Mollie" },
 {   "Age": 59,   "Order Date": "1/24/2005",   "City": "Vancouver",   "Amount": 953,   "Price": 28,   "Payment Type": "Cheque",   "Referring Site": "Etsy",   "Orders": 523,   "Name": "Randy" },
 {   "Age": 51,   "Order Date": "7/8/2005",   "City": "Mumbai",   "Amount": 157,   "Price": 62,   "Payment Type": "Cheque",   "Referring Site": "Google",   "Orders": 447,   "Name": "Bessie" },
 {   "Age": 40,   "Order Date": "6/26/2003",   "City": "Mumbai",   "Amount": 689,   "Price": 96,   "Payment Type": "Cheque",   "Referring Site": "Google",   "Orders": 950,   "Name": "Theresa" },
 {   "Age": 22,   "Order Date": "3/17/2003",   "City": "Vancouver",   "Amount": 805,   "Price": 36,   "Payment Type": "Cheque",   "Referring Site": "Etsy",   "Orders": 478,   "Name": "Lula" },
 {   "Age": 60,   "Order Date": "10/16/2006",   "City": "Mumbai",   "Amount": 325,   "Price": 40,   "Payment Type": "Cheque",   "Referring Site": "Etsy",   "Orders": 779,   "Name": "Chester" },
 {   "Age": 64,   "Order Date": "5/8/2006",   "City": "Mumbai",   "Amount": 120,   "Price": 21,   "Payment Type": "Cheque",   "Referring Site": "Etsy",   "Orders": 775,   "Name": "Estella" },
 {   "Age": 54,   "Order Date": "6/5/2009",   "City": "Vancouver",   "Amount": 138,   "Price": 7,   "Payment Type": "Cheque",   "Referring Site": "Etsy",   "Orders": 817,   "Name": "Billy" },
 {   "Age": 63,   "Order Date": "9/17/2004",   "City": "Vancouver",   "Amount": 389,   "Price": 95,   "Payment Type": "Cheque",   "Referring Site": "Google",   "Orders": 149,   "Name": "Georgia" },
 {   "Age": 54,   "Order Date": "9/23/2006",   "City": "Vancouver",   "Amount": 310,   "Price": 9,   "Payment Type": "Cash on delivery",   "Referring Site": "Google",   "Orders": 701,   "Name": "Trevor" },
 {   "Age": 51,   "Order Date": "4/26/2007",   "City": "Vancouver",   "Amount": 329,   "Price": 90,   "Payment Type": "Cash on delivery",   "Referring Site": "Google",   "Orders": 990,   "Name": "Lillian" },
 {   "Age": 20,   "Order Date": "12/3/2002",   "City": "Vancouver",   "Amount": 364,   "Price": 85,   "Payment Type": "Cash on delivery",   "Referring Site": "Google",   "Orders": 895,   "Name": "Matilda" },
 {   "Age": 41,   "Order Date": "9/20/2002",   "City": "Mumbai",   "Amount": 363,   "Price": 5,   "Payment Type": "Invoice",   "Referring Site": "Google",   "Orders": 481,   "Name": "Charlotte" },
 {   "Age": 26,   "Order Date": "12/10/2005",   "City": "Vancouver",   "Amount": 138,   "Price": 2,   "Payment Type": "Invoice",   "Referring Site": "Etsy",   "Orders": 23,   "Name": "Jerome" },
 {   "Age": 27,   "Order Date": "1/23/2000",   "City": "Shanghai",   "Amount": 301,   "Price": 98,   "Payment Type": "Cash on delivery",   "Referring Site": "Etsy",   "Orders": 461,   "Name": "Leonard" },
 {   "Age": 37,   "Order Date": "6/7/2007",   "City": "Mumbai",   "Amount": 939,   "Price": 28,   "Payment Type": "Invoice",   "Referring Site": "Pinterest",   "Orders": 531,   "Name": "Noah" },
 {   "Age": 35,   "Order Date": "1/24/2008",   "City": "Shanghai",   "Amount": 92,   "Price": 86,   "Payment Type": "Invoice",   "Referring Site": "Pinterest",   "Orders": 910,   "Name": "Eugenia" },
 {   "Age": 30,   "Order Date": "12/22/2007",   "City": "Shanghai",   "Amount": 604,   "Price": 27,   "Payment Type": "Cash on delivery",   "Referring Site": "Pinterest",   "Orders": 802,   "Name": "Nell" },
 {   "Age": 52,   "Order Date": "10/2/2003",   "City": "Shanghai",   "Amount": 865,   "Price": 85,   "Payment Type": "Invoice",   "Referring Site": "Pinterest",   "Orders": 933,   "Name": "Cynthia" },
 {   "Age": 30,   "Order Date": "8/4/2006",   "City": "Shanghai",   "Amount": 883,   "Price": 26,   "Payment Type": "Invoice",   "Referring Site": "Amazon",   "Orders": 127,   "Name": "Lucy" },
 {   "Age": 43,   "Order Date": "10/17/2001",   "City": "Shanghai",   "Amount": 803,   "Price": 6,   "Payment Type": "Invoice",   "Referring Site": "Pinterest",   "Orders": 209,   "Name": "Cameron" },
 {   "Age": 26,   "Order Date": "12/30/2005",   "City": "Shanghai",   "Amount": 690,   "Price": 72,   "Payment Type": "Invoice",   "Referring Site": "Pinterest",   "Orders": 32,   "Name": "Tony" },
 {   "Age": 23,   "Order Date": "12/7/2009",   "City": "New York City",   "Amount": 854,   "Price": 37,   "Payment Type": "Cash on delivery",   "Referring Site": "Amazon",   "Orders": 622,   "Name": "Eugene" },
 {   "Age": 30,   "Order Date": "7/11/2002",   "City": "New York City",   "Amount": 870,   "Price": 69,   "Payment Type": "Cash on delivery",   "Referring Site": "Amazon",   "Orders": 936,   "Name": "Lucinda" },
 {   "Age": 18,   "Order Date": "1/18/2003",   "City": "New York City",   "Amount": 667,   "Price": 90,   "Payment Type": "Invoice",   "Referring Site": "Pinterest",   "Orders": 980,   "Name": "Amanda" },
 {   "Age": 51,   "Order Date": "6/6/2001",   "City": "New York City",   "Amount": 82,   "Price": 92,   "Payment Type": "Invoice",   "Referring Site": "Pinterest",   "Orders": 484,   "Name": "Francis" },
 {   "Age": 60,   "Order Date": "6/5/2006",   "City": "Rome",   "Amount": 66,   "Price": 82,   "Payment Type": "Cash on delivery",   "Referring Site": "Amazon",   "Orders": 653,   "Name": "Esther" },
 {   "Age": 23,   "Order Date": "6/13/2004",   "City": "New York City",   "Amount": 187,   "Price": 22,   "Payment Type": "Invoice",   "Referring Site": "Pinterest",   "Orders": 777,   "Name": "William" },
 {   "Age": 47,   "Order Date": "6/25/2002",   "City": "Rome",   "Amount": 316,   "Price": 81,   "Payment Type": "Cash on delivery",   "Referring Site": "Pinterest",   "Orders": 744,   "Name": "Vernon" },
 {   "Age": 44,   "Order Date": "11/27/2005",   "City": "Rome",   "Amount": 186,   "Price": 66,   "Payment Type": "Cash on delivery",   "Referring Site": "Amazon",   "Orders": 860,   "Name": "Bernice" },
 {   "Age": 45,   "Order Date": "12/5/2005",   "City": "New York City",   "Amount": 375,   "Price": 11,   "Payment Type": "Cash on delivery",   "Referring Site": "Pinterest",   "Orders": 626,   "Name": "Amanda" },
 {   "Age": 47,   "Order Date": "7/24/2005",   "City": "Paris",   "Amount": 529,   "Price": 39,   "Payment Type": "Invoice",   "Referring Site": "Amazon",   "Orders": 88,   "Name": "Derek" },
 {   "Age": 59,   "Order Date": "8/9/2009",   "City": "Paris",   "Amount": 970,   "Price": 45,   "Payment Type": "Cash on delivery",   "Referring Site": "Amazon",   "Orders": 424,   "Name": "Mayme" },
 {   "Age": 45,   "Order Date": "12/24/2004",   "City": "Rome",   "Amount": 164,   "Price": 49,   "Payment Type": "Cash on delivery",   "Referring Site": "eBay",   "Orders": 628,   "Name": "Billy" },
 {   "Age": 18,   "Order Date": "11/16/2000",   "City": "Rome",   "Amount": 893,   "Price": 17,   "Payment Type": "Invoice",   "Referring Site": "Google",   "Orders": 794,   "Name": "Alice" },
 {   "Age": 41,   "Order Date": "1/11/2000",   "City": "Paris",   "Amount": 361,   "Price": 95,   "Payment Type": "Gift card",   "Referring Site": "eBay",   "Orders": 700,   "Name": "Andrew" },
 {   "Age": 26,   "Order Date": "3/6/2004",   "City": "Paris",   "Amount": 268,   "Price": 99,   "Payment Type": "Invoice",   "Referring Site": "Google",   "Orders": 125,   "Name": "Stanley" },
 {   "Age": 41,   "Order Date": "8/31/2006",   "City": "Rome",   "Amount": 709,   "Price": 27,   "Payment Type": "Gift card",   "Referring Site": "eBay",   "Orders": 935,   "Name": "Sadie" },
 {   "Age": 54,   "Order Date": "6/28/2005",   "City": "Rome",   "Amount": 800,   "Price": 38,   "Payment Type": "Gift card",   "Referring Site": "eBay",   "Orders": 525,   "Name": "Mathilda" },
 {   "Age": 62,   "Order Date": "6/27/2005",   "City": "Paris",   "Amount": 481,   "Price": 67,   "Payment Type": "Invoice",   "Referring Site": "eBay",   "Orders": 111,   "Name": "Sue" },
 {   "Age": 47,   "Order Date": "7/1/2003",   "City": "Rio de Janeiro",   "Amount": 152,   "Price": 2,   "Payment Type": "Invoice",   "Referring Site": "Google",   "Orders": 310,   "Name": "Harriett" },
 {   "Age": 36,   "Order Date": "9/8/2004",   "City": "Paris",   "Amount": 249,   "Price": 18,   "Payment Type": "Gift card",   "Referring Site": "Google",   "Orders": 404,   "Name": "Helen" },
 {   "Age": 51,   "Order Date": "12/21/2002",   "City": "Rio de Janeiro",   "Amount": 485,   "Price": 92,   "Payment Type": "Invoice",   "Referring Site": "eBay",   "Orders": 318,   "Name": "Roy" },
 {   "Age": 50,   "Order Date": "7/2/2007",   "City": "Rio de Janeiro",   "Amount": 641,   "Price": 90,   "Payment Type": "Gift card",   "Referring Site": "eBay",   "Orders": 375,   "Name": "Billy" },
 {   "Age": 23,   "Order Date": "6/17/2000",   "City": "Paris",   "Amount": 551,   "Price": 68,   "Payment Type": "Invoice",   "Referring Site": "eBay",   "Orders": 6,   "Name": "Lydia" },
 {   "Age": 43,   "Order Date": "11/29/2001",   "City": "Paris",   "Amount": 998,   "Price": 51,   "Payment Type": "Debit card",   "Referring Site": "eBay",   "Orders": 557,   "Name": "Estella" },
 {   "Age": 52,   "Order Date": "6/23/2003",   "City": "Paris",   "Amount": 722,   "Price": 93,   "Payment Type": "Debit card",   "Referring Site": "Google",   "Orders": 719,   "Name": "Miguel" },
 {   "Age": 31,   "Order Date": "9/29/2000",   "City": "Rio de Janeiro",   "Amount": 498,   "Price": 62,   "Payment Type": "Debit card",   "Referring Site": "eBay",   "Orders": 746,   "Name": "George" },
 {   "Age": 18,   "Order Date": "5/12/2006",   "City": "Rio de Janeiro",   "Amount": 684,   "Price": 11,   "Payment Type": "Gift card",   "Referring Site": "Google",   "Orders": 854,   "Name": "Verna" },
 {   "Age": 21,   "Order Date": "11/9/2004",   "City": "Seville",   "Amount": 943,   "Price": 32,   "Payment Type": "Debit card",   "Referring Site": "eBay",   "Orders": 667,   "Name": "Lucy" },
 {   "Age": 26,   "Order Date": "10/8/2008",   "City": "Lucerne",   "Amount": 555,   "Price": 12,   "Payment Type": "Debit card",   "Referring Site": "Google",   "Orders": 6,   "Name": "Carlos" },
 {   "Age": 65,   "Order Date": "5/19/2007",   "City": "Seville",   "Amount": 144,   "Price": 57,   "Payment Type": "Debit card",   "Referring Site": "eBay",   "Orders": 378,   "Name": "Keith" },
 {   "Age": 42,   "Order Date": "7/21/2003",   "City": "Lucerne",   "Amount": 226,   "Price": 72,   "Payment Type": "Debit card",   "Referring Site": "Google",   "Orders": 442,   "Name": "Isabelle" },
 {   "Age": 39,   "Order Date": "11/11/2007",   "City": "Seville",   "Amount": 137,   "Price": 65,   "Payment Type": "Debit card",   "Referring Site": "eBay",   "Orders": 630,   "Name": "Tommy" },
 {   "Age": 37,   "Order Date": "8/22/2008",   "City": "Chefchaouen",   "Amount": 267,   "Price": 15,   "Payment Type": "Debit card",   "Referring Site": "Google",   "Orders": 990,   "Name": "Edith" },
 {   "Age": 47,   "Order Date": "2/17/2001",   "City": "Lucerne",   "Amount": 677,   "Price": 5,   "Payment Type": "Debit card",   "Referring Site": "eBay",   "Orders": 63,   "Name": "Martin" },
 {   "Age": 18,   "Order Date": "6/8/2003",   "City": "Lucerne",   "Amount": 638,   "Price": 15,   "Payment Type": "Debit card",   "Referring Site": "Google",   "Orders": 105,   "Name": "Henrietta" },
 {   "Age": 18,   "Order Date": "8/5/2007",   "City": "Chefchaouen",   "Amount": 294,   "Price": 54,   "Payment Type": "Debit card",   "Referring Site": "eBay",   "Orders": 206,   "Name": "Rosie" },
 {   "Age": 25,   "Order Date": "6/3/2000",   "City": "Lucerne",   "Amount": 223,   "Price": 49,   "Payment Type": "Debit card",   "Referring Site": "eBay",   "Orders": 628,   "Name": "Willie" },
 {   "Age": 41,   "Order Date": "12/4/2006",   "City": "Chefchaouen",   "Amount": 98,   "Price": 56,   "Payment Type": "Debit card",   "Referring Site": "Google",   "Orders": 985,   "Name": "Milton" },
 {   "Age": 35,   "Order Date": "9/15/2007",   "City": "Dublin",   "Amount": 731,   "Price": 40,   "Payment Type": "PayPal",   "Referring Site": "eBay",   "Orders": 807,   "Name": "Jacob" },
 {   "Age": 31,   "Order Date": "4/4/2007",   "City": "London",   "Amount": 320,   "Price": 19,   "Payment Type": "PayPal",   "Referring Site": "eBay",   "Orders": 306,   "Name": "Carrie" },
 {   "Age": 59,   "Order Date": "8/25/2009",   "City": "Dublin",   "Amount": 922,   "Price": 99,   "Payment Type": "PayPal",   "Referring Site": "Google",   "Orders": 660,   "Name": "Rebecca" },
 {   "Age": 45,   "Order Date": "8/8/2008",   "City": "Dublin",   "Amount": 669,   "Price": 88,   "Payment Type": "Debit card",   "Referring Site": "Facebook",   "Orders": 806,   "Name": "Victor" },
 {   "Age": 25,   "Order Date": "1/26/2008",   "City": "Dublin",   "Amount": 906,   "Price": 10,   "Payment Type": "Debit card",   "Referring Site": "Facebook",   "Orders": 841,   "Name": "Edith" },
 {   "Age": 39,   "Order Date": "7/21/2004",   "City": "Prague",   "Amount": 350,   "Price": 93,   "Payment Type": "PayPal",   "Referring Site": "eBay",   "Orders": 764,   "Name": "James" }
]
}