const { Gateway, Wallets, } = require('fabric-network');
const fs = require('fs');
const path = require("path")
const log4js = require('log4js');
const logger = log4js.getLogger('teco');
const util = require('util')


const helper = require('../helperv2')
const query = async (channelName, chaincodeName, args, fcn, username, org_name) => {

    try {
        const ccp = await helper.getCCP(org_name) //JSON.parse(ccpJSON);

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);
        let result;
        console.log(args[0]);
        switch (fcn) {
            case "queryProduct":
                result = await contract.evaluateTransaction(fcn, args.productCode);
                break;
            case "queryOrder":
                result = await contract.evaluateTransaction(fcn, args.orderCode);
                break;
        }
        // if (fcn == "queryProduct" || fcn == "queryAllProducts" || fcn == 'queryOrder' || fcn == 'queryAllOrders' || 'getOrderHistory') {
        //     result = await contract.evaluateTransaction(fcn, args[0]);

        // } else if (fcn == "readPrivateCar" || fcn == "queryPrivateDataHash"
        //     || fcn == "collectionCarPrivateDetails") {
        //     result = await contract.evaluateTransaction(fcn, args[0], args[1]);
        //     // return result

        // }
        console.log(result)
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        result = JSON.parse(result.toString());
        return result
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        return error.message

    }
}

exports.query = query