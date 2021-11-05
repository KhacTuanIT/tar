/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '.', 'connection.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        // const walletPath = path.join('/vars/profiles/vscode/wallets', 'org0.example.com');
        const walletPath = path.join('../../profiles/vscode/wallets', 'supply.teco.com');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get('Admin');
        if (!identity) {
            console.log('Admin identity can not be found in the wallet');
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'Admin', discovery: { enabled: true, asLocalhost: false } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('ecsupply');

        // Get the contract from the network.
        const contract = network.getContract('teco');

        // Submit the specified transaction.
        const randomId = Math.floor(Math.random() * 500000);
        const product = {
            name: 'Product4',
            code: 'PR04',
            manufactororId: 'Dell',
            color: 'black',
            price: '100',
            cpu: 'r7',
            ram: '4gb',
            screen: 'FullHD',
            keyboard: 'No led',
            storage: '128GB',
            network: 'Wifi 6',
            usb: '3x 3.0',
            origin: 'USA',
            yearOrigin: '2021',
            owner: '',
            isDeleted: false
        }
        const res = await contract.submitTransaction('testCreateProductLedger', JSON.stringify(product));
        console.log(res.toString());
        console.log('Transaction has been submitted');

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}

main();