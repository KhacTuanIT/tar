'use strict';

var { Gatewate, Wallets } = require('fabric-network');
const path = require('path');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');

const util = require('util');

const getCCP = async () => {
    let ccpPath = path.resolve(__dirname, './connection.json');
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);
    return ccp;
}

const getMspId = async (org) => {
    if (!org) return null;
    const ccp = await getCCP();
    const mspId = ccp.organizations[org + '.teco.com'].mspid;
    return mspId;
}

// get certificate authority url
const getCaUrl = async (org, ccp) => {
    if (!org) {
        return null
    }
    let caURL = ccp.certificateAuthorities['ca1.' + org + '.teco.com'].url;
    return caURL;
}

const getWalletPath = async (org) => {
    let walletPath = path.join(process.cwd(), '../../profiles/vscode/wallets/' + org + '.teco.com');
    return walletPath;
}

const getAffiliation = async (org) => {
    return org + '.department1';
}

const getRegisteredUser = async (username, password, userType, userOrg, isJson) => {
    let ccp = await getCCP();

    const caURL = await getCaUrl(userOrg, ccp);
    const ca = new FabricCAServices(caURL);

    const walletPath = await getWalletPath(userOrg);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const userIdentity = await wallet.get(username);
    if (userIdentity) {
        console.log(`An identity for the user ${username} already exists in the wallet`);
        var response = {
            success: true,
            message: username + ' enroled successfully'
        }
        return response;
    }

    let adminIdentity = await wallet.get('Admin');
    if (!adminIdentity) {
        console.log('An identity for the admin user "Admin" does not exist in the wallet');
        await enrollAdmin(userOrg, cpp);
        adminIdentity = await wallet.get('Admin');
        console.log('Admin enrolled successfully');
    }

    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'Admin');
    let secret;
    try {
        secret = await ca.register(
            {
                affiliation: await getMspId(userOrg),
                enrollmentID: username,
                enrollmentSecret: password,
                role: 'client',
                attrs: [
                    {
                        'name': 'usertype',
                        'value': userType,
                        'ecert': true
                    }
                ],
                maxEnrollments: 15
            }, adminUser
        );
    } catch (error) {
        return error.message;
    }

    const enrollment = await ca.enroll(
        {
            enrollmentID: username,
            enrollmentSecret: secret
        }
    )

    let x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes()
        },
        mspId: getMspId(userOrg),
        type: 'X.509'
    };

    await wallet.put(username, x509Identity);
    console.log(`Successfully registered and enrolled admin user ${username} and imported it into the wallet`);

    var response = {
        success: true,
        message: username + ' enrolled Successfully',
    };
    return response;
}

const isUserRegistered = async (username, userOrg) => {
    const walletPath = await getWalletPath(userOrg);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const userIdentity = await wallet.get(username);
    if (userIdentity) {
        console.log(`An identity for the user ${username} exists in the wallet`);
        return true
    }
    return false
}

const getCaInfo = async (org, ccp) => {
    if (!org) return null;
    let caInfo = ccp.certificateAuthorities['ca1.' + org + '.teco.com'];
    return caInfo;
}

const enrollAdmin = async (org, ccp) => {
    console.log('calling enroll Admin method');
    try {
        const caInfo = await getCaInfo(org, ccp);
        const caTLSCACerts = caInfo.caTLSCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        const walletPath = await getWalletPath(org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const identity = await wallet.get('Admin');
        if (identity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        const enrollment = await ca.enroll({
            enrollmentID: 'Admin',
            enrollmentSecret: 'adminpw',
            attrs: [
                {
                    'name': 'usertype',
                    'value': 'admin',
                    'ecert': true
                }
            ]
        });

        let x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes()
            },
            mspId: getMspId(org),
            type: 'X.509'
        };

        await wallet.put('Admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
        return;
    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
    }
}

const registerAndGetSecret = async (username, password, userType, userOrg) => {
    let ccp = await getCCP();

    const caURL = await getCaUrl(userOrg, ccp);
    console.log("caURL: ", caURL);

    const ca = new FabricCAServices(caURL);
    console.log("CA: ", ca);
    const walletPath = await getWalletPath(userOrg);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    console.log(`Wallet: ${wallet}`);

    const userIdentity = await wallet.get(username);
    console.log("USER IDENTITY: ", userIdentity);
    if (userIdentity) {
        console.log(`An identity for the user ${username} already exists in the wallet`);
        var response = {
            success: true,
            message: username + ' enrolled Successfully',
        };
        return response;
    }

    let adminIdentity = await wallet.get('Admin');
    console.log("ADMIN IDENTITY: ", adminIdentity);
    if (!adminIdentity) {
        console.log('An identity for the admin user "admin" does not exist in the wallet');
        await enrollAdmin(userOrg, ccp);
        adminIdentity = await wallet.get('Admin');
        console.log("Admin Enrolled Successfully");
    }

    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    console.log("PROVIDER: ", provider);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');
    console.log("ADMIN USER: ", adminUser);

    const aff = await getAffiliation(userOrg);
    console.log("AFF: ", aff);
    let secret;
    try {
        secret = await ca.register({
            // affiliation: aff,
            enrollmentID: username,
            enrollmentSecret: password,
            role: 'client',
            attrs: [
                {
                    'name': 'usertype',
                    'value': userType,
                    'ecert': true
                }
            ]
        }, adminUser);
    } catch (error) {
        console.log("ERROR REGISTER: ", error);
        return error.message;
    }

    var response = {
        success: true,
        message: username + ' register successfully',
        secret: secret
    }

    return response;
}

var getLogger = function (moduleName) {
    var logger = log4js.getLogger(moduleName);
    logger.setLevel('DEBUG');
    return logger;
};

exports.getRegisteredUser = getRegisteredUser;
exports.getLogger = getLogger;

module.exports = {
    getCCP: getCCP,
    getWalletPath: getWalletPath,
    getRegisteredUser: getRegisteredUser,
    isUserRegistered: isUserRegistered,
    registerAndGetSecret: registerAndGetSecret
}