const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require("path");
const log4js = require('log4js');
const logger = log4js.getLogger('teco');
const util = require('util');
var hfc = require('fabric-client');
var Peer = require('fabric-client/lib/Peer.js');
const { BlockDecoder } = require('fabric-common');

const helper = require('../helperv2');

// var queryChaincode = function (peer, channelName, chaincodeName, args, fcn, username, org) {
//     var channel = helperExtra.getChannelForOrg(org);
//     var client = helperExtra.getClientForOrg(org);
//     var target = buildTarget(peer, org);
//     return helperExtra.getRegisteredUsers(username, org).then((user) => {
//         tx_id = client.newTransactionID();
//         // send query
//         var request = {
//             chaincodeId: chaincodeName,
//             txId: tx_id,
//             fcn: fcn,
//             args: args
//         };
//         return channel.queryByChaincode(request, target);
//     }, (err) => {
//         logger.info('Failed to get submitter \'' + username + '\'');
//         return 'Failed to get submitter \'' + username + '\'. Error: ' + err.stack ? err.stack :
//             err;
//     }).then((response_payloads) => {
//         if (response_payloads) {
//             for (let i = 0; i < response_payloads.length; i++) {
//                 logger.info(args[0] + ' now has ' + response_payloads[i].toString('utf8') +
//                     ' after the move');
//                 return args[0] + ' now has ' + response_payloads[i].toString('utf8') +
//                     ' after the move';
//             }
//         } else {
//             logger.error('response_payloads is null');
//             return 'response_payloads is null';
//         }
//     }, (err) => {
//         logger.error('Failed to send query due to error: ' + err.stack ? err.stack :
//             err);
//         return 'Failed to send query due to error: ' + err.stack ? err.stack : err;
//     }).catch((err) => {
//         logger.error('Failed to end to end test with error:' + err.stack ? err.stack :
//             err);
//         return 'Failed to end to end test with error:' + err.stack ? err.stack :
//             err;
//     });
// };
var getBlockByNumber = async function (channelName, blockNumber, username, org) {
    var ccp = await helper.getCCP();
    const walletPath = await helper.getWalletPath(org);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    let identity = await wallet.get(username);
    if (!identity) {
        console.log(`${username} identity can not be found in the wallet`);
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: username, discovery: { enabled: true, asLocalhost: false } });

    var network = await gateway.getNetwork(channelName);
    var contract = network.getContract('qscc');

    return await contract.evaluateTransaction('GetBlockByNumber', channelName, blockNumber);
};
var getTransactionByID = async function (chaincodeName, trxnID, username, org) {
    var ccp = await helper.getCCP();
    const walletPath = await helper.getWalletPath(org);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    let identity = await wallet.get(username);
    if (!identity) {
        console.log(`${username} identity can not be found in the wallet`);
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: username, discovery: { enabled: true, asLocalhost: false } });

    var network = await gateway.getNetwork(channelName);
    var contract = network.getContract('qscc');
    return await contract.evaluateTransaction('GetTransactionByID', chaincodeName, trxnID);
};

var getBlockByTxID = async function (channelName, trxnID, username, org) {
    var ccp = await helper.getCCP();
    const walletPath = await helper.getWalletPath(org);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    let identity = await wallet.get(username);
    if (!identity) {
        console.log(`${username} identity can not be found in the wallet`);
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: username, discovery: { enabled: true, asLocalhost: false } });

    var network = await gateway.getNetwork(channelName);
    var contract = network.getContract('qscc');
    return await contract.evaluateTransaction('GetBlockByTxID', channelName, trxnID);
}

var getBlockByHash = async function (peer, hash, username, org) {
    var ccp = await helper.getCCP();
    const walletPath = await helper.getWalletPath(org);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    let identity = await wallet.get(username);
    if (!identity) {
        console.log(`${username} identity can not be found in the wallet`);
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: username, discovery: { enabled: true, asLocalhost: false } });

    var network = await gateway.getNetwork(channelName);
    var contract = network.getContract('qscc');
    return await contract.evaluateTransaction('GetBlockByHash', channelName, trxnID);
};
// var getChainInfo = function (peer, username, org) {
//     var target = buildTarget(peer, org);
//     var channel = helperExtra.getChannelForOrg(org);

//     return helperExtra.getRegisteredUsers(username, org).then((member) => {
//         return channel.queryInfo(target);
//     }, (err) => {
//         logger.info('Failed to get submitter "' + username + '"');
//         return 'Failed to get submitter "' + username + '". Error: ' + err.stack ?
//             err.stack : err;
//     }).then((blockchainInfo) => {
//         if (blockchainInfo) {
//             // FIXME: Save this for testing 'getBlockByHash'  ?
//             logger.debug('===========================================');
//             logger.debug(blockchainInfo.currentBlockHash);
//             logger.debug('===========================================');
//             //logger.debug(blockchainInfo);
//             return blockchainInfo;
//         } else {
//             logger.error('response_payloads is null');
//             return 'response_payloads is null';
//         }
//     }, (err) => {
//         logger.error('Failed to send query due to error: ' + err.stack ? err.stack :
//             err);
//         return 'Failed to send query due to error: ' + err.stack ? err.stack : err;
//     }).catch((err) => {
//         logger.error('Failed to query with error:' + err.stack ? err.stack : err);
//         return 'Failed to query with error:' + err.stack ? err.stack : err;
//     });
// };
// //getInstalledChaincodes
// var getInstalledChaincodes = function (peer, type, username, org) {
//     var target = buildTarget(peer, org);
//     var channel = helperExtra.getChannelForOrg(org);
//     var client = helperExtra.getClientForOrg(org);

//     return helperExtra.getOrgAdmin(org).then((member) => {
//         if (type === 'installed') {
//             return client.queryInstalledChaincodes(target);
//         } else {
//             return channel.queryInstantiatedChaincodes(target);
//         }
//     }, (err) => {
//         logger.info('Failed to get submitter "' + username + '"');
//         return 'Failed to get submitter "' + username + '". Error: ' + err.stack ?
//             err.stack : err;
//     }).then((response) => {
//         if (response) {
//             if (type === 'installed') {
//                 logger.debug('<<< Installed Chaincodes >>>');
//             } else {
//                 logger.debug('<<< Instantiated Chaincodes >>>');
//             }
//             var details = [];
//             for (let i = 0; i < response.chaincodes.length; i++) {
//                 logger.debug('name: ' + response.chaincodes[i].name + ', version: ' +
//                     response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
//                 );
//                 details.push('name: ' + response.chaincodes[i].name + ', version: ' +
//                     response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
//                 );
//             }
//             return details;
//         } else {
//             logger.error('response is null');
//             return 'response is null';
//         }
//     }, (err) => {
//         logger.error('Failed to send query due to error: ' + err.stack ? err.stack :
//             err);
//         return 'Failed to send query due to error: ' + err.stack ? err.stack : err;
//     }).catch((err) => {
//         logger.error('Failed to query with error:' + err.stack ? err.stack : err);
//         return 'Failed to query with error:' + err.stack ? err.stack : err;
//     });
// };
// var getChannels = function (peer, username, org) {
//     var target = buildTarget(peer, org);
//     var channel = helperExtra.getChannelForOrg(org);
//     var client = helperExtra.getClientForOrg(org);

//     return helperExtra.getRegisteredUsers(username, org).then((member) => {
//         //channel.setPrimaryPeer(targets[0]);
//         return client.queryChannels(target);
//     }, (err) => {
//         logger.info('Failed to get submitter "' + username + '"');
//         return 'Failed to get submitter "' + username + '". Error: ' + err.stack ?
//             err.stack : err;
//     }).then((response) => {
//         if (response) {
//             logger.debug('<<< channels >>>');
//             var channelNames = [];
//             for (let i = 0; i < response.channels.length; i++) {
//                 channelNames.push('channel id: ' + response.channels[i].channel_id);
//             }
//             logger.debug(channelNames);
//             return response;
//         } else {
//             logger.error('response_payloads is null');
//             return 'response_payloads is null';
//         }
//     }, (err) => {
//         logger.error('Failed to send query due to error: ' + err.stack ? err.stack :
//             err);
//         return 'Failed to send query due to error: ' + err.stack ? err.stack : err;
//     }).catch((err) => {
//         logger.error('Failed to query with error:' + err.stack ? err.stack : err);
//         return 'Failed to query with error:' + err.stack ? err.stack : err;
//     });
// };

// function buildTarget(peer, org) {
//     var target = null;
//     if (typeof peer !== 'undefined') {
//         let targets = helperExtra.newPeers([peer], org);
//         if (targets && targets.length > 0) target = targets[0];
//     }

//     return target;
// }

const qscc = async (channelName, chaincodeName, args, fcn, username, org_name) => {

    try {
        // const peer = args.peer;
        // const ccp = await helper.getCCP(org_name) //JSON.parse(ccpJSON);

        // const walletPath = await helper.getWalletPath(org_name) //.join(process.cwd(), 'wallet');
        // const wallet = await Wallets.newFileSystemWallet(walletPath);
        // console.log(`Wallet path: ${walletPath}`);

        // // Check to see if we've already enrolled the user.
        // let identity = await wallet.get(username);
        // if (!identity) {
        //     console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
        //     await helper.getRegisteredUser(username, org_name, true)
        //     identity = await wallet.get(username);
        //     console.log('Run the registerUser.js application before retrying');
        //     return;
        // }

        // const gateway = new Gateway();
        // await gateway.connect(ccp, {
        //     wallet, identity: username, discovery: { enabled: true, asLocalhost: true }
        // });

        // const network = await gateway.getNetwork(channelName);

        // const contract = network.getContract(chaincodeName);
        // let result;
        try {
            if (fcn == 'GetBlockByNumber') {
                result = await getBlockByNumber(channelName, args.blockNumber, username, org_name);
                logger.debug("GetBlockByNumber: ", result);
                result = BlockDecoder.decode(result);
            } else if (fcn == "GetBlockByTxID") {
                result = await getBlockByTxID(channelName, args.txID, username, org_name);
                logger.debug("GetBlockByTxID: ", result);
                result = BlockDecoder.decode(result);
            }
        } catch (error) {
            logger.error("Error QSCC: ", error);
        }


        return result
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        return error.message
    }
}

exports.qscc = qscc