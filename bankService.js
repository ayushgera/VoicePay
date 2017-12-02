const request = require('request-promise');
const jsonfile = require('jsonfile');
const BANK_API_URL = "http://localhost/api/";

global.APIResult = {
    "trasnferStatus": "not started"
};

var createURL = function(uri){
    return BANK_API_URL+uri;
}

//get mini statment
var getMiniStatement = function(accountNumber){
    var options = {
        method: 'POST',
        uri: createURL('GetMiniState4anAccount'),
        body: {
            Account_Number: accountNumber || "00430100001323"
        },
        headers: getHeader(),
        json: true
    };

    /*request(options)
        .then(function (parsedBody) {
            // POST succeeded
            console.log(parsedBody);
        })
        .catch(function (err) {
            // POST failed
            console.log(err);
        });*/
}

//get transaction 4 account
var getTransc4Account = function(accountNumber, type, fromDate, toDate){
    var currDate= new Date();
    var defaultToDate= [currDate.getFullYear(), currDate.getMonth(), currDate.getDate()].join("");
    var options = {
        method: 'POST',
        uri: createURL('GetMiniState4anAccount'),
        body: {
            "Account_Number": accountNumber || "29040100001234",
            "Type_of_account": type || "SBA",
            "From_Date": fromDate || 20170901,
            "To_Date": toDate || defaultToDate
        },
        headers: getHeader(),
        json: true
    };

    request(options)
        .then(function (parsedBody) {
            // POST succeeded
            console.log(JSON.stringify(parsedBody));
            if(parsedBody && parsedBody.length>0){
                var miniStatement= parsedBody[0]["Mini_Statement"];
                if(!miniStatement || miniStatement.length<1){
                    return;
                }
                setBankOutput("allTransactions", {"29040100001234":miniStatement});
            }
        })
        .catch(function (err) {
            // POST failed
            console.log(err);
        });
}

var getTransactionsForReceiver= function(receiver, transactions, accountNumber){
    var accountNumber= accountNumber || "29040100001234";
    if(!transactions[accountNumber] || transactions[accountNumber].length<1){
        return;
    }
    var transactionsToReceiver= transactions[accountNumber].filter(function(transaction){
        // for now we expect Tran_Rmks to contain the receiver name
        // To mock receiver name is inseeted first
        transaction["Tran_Rmks"]+=" to "+receiver;
        return transaction["Tran_Rmks"].indexOf(receiver) > -1;
    });
    console.log(transactionsToReceiver);
    var total = transactionsToReceiver.reduce(function(sum, transaction) {
        return sum + transaction["Tran_Amt"];
    }, 0);
    console.log("total= "+total);
    return total;
}

//only for mocking purpose
var saveTransactionHistory= function(receiver, amount, date){
    var currDate= new Date();
    var defaultToDate= [currDate.getFullYear(), currDate.getMonth()+1, currDate.getDate()].join("-");
    var existingTxns= getBankOutput("newTxnHistory");
    //MOCK: accNumber
    // create API to extract this from the available registered beneficiaries given the name
    var beneficiaryFile= jsonfile.readFileSync('./identifiedBeneficiaries.json');
    var accNumber = beneficiaryFile && beneficiaryFile.beneficiary 
        && beneficiaryFile.beneficiary.toLowerCase() === "ravneet" ? "29040100001234" : "29040100001235";
        console.log(accNumber);
    var txns=[];
    if(existingTxns && existingTxns[accNumber] && existingTxns[accNumber].length>0){
        txns = existingTxns[accNumber];
    }
    txns.push({
        "receiver" : receiver,
        "amount" : amount,
        "date" : date || defaultToDate
    });
    var txnOutput = {};
    txnOutput[accNumber]= txns;
    setBankOutput("newTxnHistory",txnOutput);
    console.log("set transaction in history for "+receiver+": "+txns);
}

//only for mocking purpose
var getTransactionHistory= function(receiver, identified){
    var txnsObj= getBankOutput("newTxnHistory");
    console.log("get transaction history for "+receiver+": "+txnsObj);
    //MOCK: accNumber
    // create API to extract this from the available registered beneficiaries given the name
    var accNumber = identified === "ravneet" ? "29040100001234" : "29040100001235";
    console.log(accNumber);
    if(!txnsObj || !txnsObj[accNumber]){
        return {
            total: 0
        };
    }
    var transactionsToReceiver= txnsObj[accNumber].filter(function(transaction){
        return transaction["receiver"].indexOf(receiver) > -1;
    });
    if(!transactionsToReceiver || transactionsToReceiver.length<1){
        return {
            total: 0
        };
    }
    var total = transactionsToReceiver.reduce(function(sum, transaction) {
        return sum + parseFloat(transaction["amount"]) ;
    }, 0);
    
    var isToday=false;
    if(new Date(transactionsToReceiver[0].date).toDateString()==new Date().toDateString()){
        isToday=true;
    }

    return {
        isToday: isToday,
        total: total || 0,
        txnCount : transactionsToReceiver.length
    }
}

var getBillers = function(customerId){
    var options = {
        method: 'POST',
        uri: createURL('GetBillers'),
        body: {
            "Customer_Id": customerId || "526814203"
        },
        headers: getHeader(),
        json: true
    };

    request(options)
    .then(function (parsedBody) {
        // POST succeeded
        console.log(parsedBody);
    })
    .catch(function (err) {
        // POST failed
        console.log(err);
    });
}

//Schedule a bill payment
var scheduleBillPayment =function(customerId,debitAccountNumber,billerId,amount,date){
    var options = {
        method: 'POST',
        uri: createURL('SchedaBillPay'),
        body: {
        // Customer_Id: customerId,
            //Debit_Acct:debitAccountNumber,
            //BIller_ID :billerId,
            //Amount:amount,
            //date:date
            Customer_Id:"EWB000123",
            Debit_Acct:"29040100001234",
            BIller_ID:"DB000212",
            Amount:"9000",
            Date : "20171123"
    },
    headers: getHeader(),
    json: true // Automatically stringifies the body to JSON
    };

    request(options)
    .then(function (parsedBody) {
        // POST succeeded
        console.log(parsedBody);
    })
    .catch(function (err) {
        // POST failed
        console.log(err);
    });
}

//get account details
var getAccountDetails = function(accountNumber){
    var options = {
        method: 'POST',
        uri: createURL('GetAccDetails'),
        body: {
            Account_Number: "00430100001323"
            //Account_Number: accountNumber
        },
        headers: getHeader(),
        json: true // Automatically stringifies the body to JSON
    };

    setBankOutput("accountDetails", {Available_Balance: 1000});
    /*
    request(options)
        .then(function (parsedBody) {
            // change to handle all acounts later
            if(parsedBody && parsedBody[0]){
                setBankOutput("accountDetails", parsedBody[0]);
            }
        })
        .catch(function (err) {
            // POST failed
            console.log(err);
    });*/
}

//get customer account details
var getCustomerAccountDetails = function(customerId){
    var options = {
        method: 'POST',
        uri: createURL('GetCustAccList'),
        body: {
            Customer_Id: "440728117"
            //Customer_Id: customerId
        },
        headers: getHeader(),
        json: true // Automatically stringifies the body to JSON
    };

    request(options)
        .then(function (parsedBody) {
            // POST succeeded
            console.log(parsedBody);
        })
        .catch(function (err) {
            // POST failed
            console.log(err);
    });
}

//make a bill payment
var makeBillPayment = function(customerId, billerId, amount){
    var options = {
        method: 'POST',
        uri: createURL('MakeABillPayment'),
        body: {
            "Customer_Id": customerId || 526814203,
            "Debit_Acct": "29040100001234", //this info would be available with the bank for a given custId
            "BIller_ID": billerId || 123456991,
            "Amount": amount || 9000
        },
        headers: getHeader(),
        json: true // Automatically stringifies the body to JSON
    };
    //set invoice id
    setBankOutput("billInvoice", "123123123");
    getAccountDetails();

    /*request(options)
        .then(function (parsedBody) {
            // POST succeeded
            console.log(parsedBody);
            if(parsedBody && parsedBody[0] && parsedBody[0].Ser_Req_NUM){
                setBankOutput("billInvoice", parsedBody[0].Ser_Req_NUM);
                getAccountDetails();
            }
        })
        .catch(function (err) {
            // POST failed
            console.log(err);
    });*/
}

var billPaymentByBillerName = function(billerName, customerId, amount){

    var billers= [{
        Biller_Name: "Vodafone",
        Biller_ID: "123"
    },{
        Biller_Name: "Airtel",
        Biller_ID: "321"
    }];

    var foundBiller;
    foundBiller= billers.filter(function(biller){
        return biller.Biller_Name.toLowerCase() === billerName.toLowerCase();
    });

    if(!foundBiller){
        return;
    }
    makeBillPayment(customerId, foundBiller.Biller_ID, amount);
    
    /*request({
        method: 'POST',
        uri: createURL('GetBillers'),
        body: {
            "Customer_Id": customerId || "456744133"
        },
        headers: getHeader(),
        json: true
    }).then(function(response){
        //find the biller with the given name
        var foundBiller; //Calcible
        if(response && response.length>0){
            console.log(JSON.stringify(response));
            foundBiller= response.filter(function(biller){
                return biller.Biller_Name.toLowerCase() === billerName.toLowerCase();
            });
        }
        if(!foundBiller){
            return;
        }
        makeBillPayment(customerId, foundBiller.Biller_ID, amount);
    });*/
}

var customerToCustomerTransaction = function(debitAccount,CreditAccount,amount,message){
    var options = {
        method: 'POST',
        uri: createURL('Cust2CustFundsTrf'),
        body: {
            "Dr_Acct": debitAccount || "29040100001234",
            "Cr_ Acct": CreditAccount || "5720100021238",
            "Tran_Amt": amount || "45000.00",
            "Tran_Msg": message || "Test Fund Trasfer"
        },
        headers: getHeader(),
        json: true // Automatically stringifies the body to JSON
    };

    global.APIResult.trasnferStatus = "success";
    getAccountDetails("29040100001234"); 
    /*
    request(options)
        .then(function (parsedBody) {
            // POST succeeded
            console.log(parsedBody);
            if(parsedBody && parsedBody[0] && parsedBody[0].Trans_Status==="OK"){
                global.APIResult.trasnferStatus = "success";
                getAccountDetails("29040100001234"); 
            }else{
                global.APIResult.trasnferStatus = "failed";
            }
        })
        .catch(function (err) {
            // POST failed
            console.log(err);
            global.APIResult.trasnferStatus = "failed";
    });*/
}

function getHeader(){
    return {
        'apikey': 'LozkoEa1HEipfjh',
        'Content-Type': 'application/json'
    };
}

var setBankOutput = function(key, value){
    global.bankOutput= global.bankOutput || {};
    global.bankOutput[key]= value;
    console.log(global.bankOutput);
    //jsonfile.writeFileSync('./bankOutput.json', {"output":value}, {spaces: 2, EOL: '\r\n'});
}

var getBankOutput = function(key){
    if(!global.bankOutput){
        return;
    }
    console.log("get "+key+ "from :" +global.bankOutput);
    return global.bankOutput[key];
    //return jsonfile.readFileSync('./bankOutput.json');
}

var getBillCycleRemainingDays = function(billDate){
    var date1 = new Date(billDate || "11/14/2017");
    var date2 = new Date();
    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
    // handle DST with UTC
    return diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
}

var getScheduledPaymentDetails = function(biller, billDate, amount){
    //for mocking, we always set the bill date to be 2 days ahead
    var newBllDate = new Date();
    newBllDate.setDate(newBllDate.getDate() + 2);
    return {
        biller : biller || "JC Penny Credit Card",
        billDate : billDate || newBllDate,
        amount : amount || "230"
    };
}

module.exports = {
    getMiniStatement : getMiniStatement,
    getTransc4Account : getTransc4Account,
    getBillers : getBillers,
    getAccountDetails : getAccountDetails,
    billPaymentByBillerName : billPaymentByBillerName,
    scheduleBillPayment : scheduleBillPayment,
    getCustomerAccountDetails : getCustomerAccountDetails,
    makeBillPayment : makeBillPayment,
    customerToCustomerTransaction : customerToCustomerTransaction,
    getScheduledPaymentDetails: getScheduledPaymentDetails,
    getTransactionsForReceiver: getTransactionsForReceiver,
    saveTransactionHistory: saveTransactionHistory,
    getTransactionHistory: getTransactionHistory,
    setBankOutput : setBankOutput,
    getBankOutput: getBankOutput
};