'use strict';

const { Contract } = require('fabric-contract-api');

class ProductContract extends Contract {
    async initProductLedger(ctx) {
        console.log('initProductLedger');
        const assets = [
            {
                name: 'Product1',
                code: 'PR01',
                manufactororId: 'MSI',
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
                yearOrigin: '2019',
                owner: '',
                isDeleted: false
            }
        ];

        for (let index = 0; index < assets.length; index++) {
            assets[index].docType = 'product';
            await ctx.stub.putState(assets[index].code, Buffer.from(JSON.stringify(assets[index])));
            console.log('add product ---------------------> ', assets[index].code);
        }
        console.log('initProductLedger done ============');
    }

    async queryProduct(ctx, productCode) {
        const productAsBytes = await ctx.stub.getState(productCode);
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`${productCode} does not exist`);
        }
        return productAsBytes.toString();
    }

    async createProductLedger(ctx, args) {
        let userType = await this.getCurrentUserType(ctx);
        if ((userType != "admin") &&
            (userType != "user") &&
            (userType != "retailer"))
            throw new Error(`This user does not have access to create an product`);

        const product_details = JSON.parse(args);
        const product = {
            name: product_details.name,
            code: product_details.code,
            manufactororId: product_details.manufactororId,
            color: product_details.color,
            price: product_details.price,
            cpu: product_details.cpu,
            ram: product_details.ram,
            screen: product_details.screen,
            keyboard: product_details.keyboard,
            storage: product_details.storage,
            network: product_details.network,
            usb: product_details.usb,
            origin: product_details.origin,
            yearOrigin: product_details.yearOrigin,
            isDeleted: false,
            owner: product_details.owner,
            docType: 'product'
        }

        await ctx.stub.putState(product.code, product.toBuffer());

        // Define and set event
        const event_obj = product;
        event_obj.event_type = "createProduct";   //  add the field "event_type" for the event to be processed

        try {
            await ctx.stub.setEvent(EVENT_TYPE, event_obj.toBuffer());
        }
        catch (error) {
            console.log("Error in sending event");
        }
        finally {
            console.log("Attempted to send event = ", product);
        }
        return product.toBuffer();
    }

    async testCreateProductLedger(ctx, args) {
        const product_details = JSON.parse(args);
        const product = {
            name: product_details.name,
            code: product_details.code,
            manufactororId: product_details.manufactororId,
            color: product_details.color,
            price: product_details.price,
            cpu: product_details.cpu,
            ram: product_details.ram,
            screen: product_details.screen,
            keyboard: product_details.keyboard,
            storage: product_details.storage,
            network: product_details.network,
            usb: product_details.usb,
            origin: product_details.origin,
            yearOrigin: product_details.yearOrigin,
            isDeleted: false,
            owner: product_details.owner,
            docType: 'product'
        }

        const res = await ctx.stub.putState(product.code, product.toBuffer());
        return res;
    }

    async queryAllProducts(ctx) {
        const startKey = '';
        const endKey = '';
        const allProducts = [];
        for await (const { key, value } of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                if (record.docType === 'product') {
                    allProducts.push({ Key: key, Value: record });
                }
            } catch (error) {
                console.log(error);
            }
        }
        console.log(allProducts);
        return JSON.stringify(allProducts);
    }

    async changeProductOwner(ctx, productCode, newOwner) {
        console.info('============= START : changeProductOwner ===========');

        let userType = await this.getCurrentUserType(ctx);
        if ((userType != "admin") &&
            (userType != "user") &&
            (userType != "retailer"))
            throw new Error(`This user does not have access to change an product owner`);

        const productAsBytes = await ctx.stub.getState(productCode); // get the car from chaincode state
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`${productCode} does not exist`);
        }
        const product = JSON.parse(productAsBytes.toString());
        if (product.docType !== 'product') {
            throw new Error(`${productCode} does not exist`);
        }
        product.owner = newOwner;

        await ctx.stub.putState(productCode, Buffer.from(JSON.stringify(product)));
        console.info('============= END : changeProductOwner ===========');
    }

    async deleteProduct(ctx, productCode) {
        console.info('============= START : changeProductOwner ===========');

        let userType = await this.getCurrentUserType(ctx);
        if ((userType != "admin") &&
            (userType != "user") &&
            (userType != "retailer"))
            throw new Error(`This user does not have access to change an product owner`);

        const productAsBytes = await ctx.stub.getState(productCode); // get the car from chaincode state
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`${productCode} does not exist`);
        }
        const product = JSON.parse(productAsBytes.toString());
        if (product.docType !== 'product') {
            throw new Error(`${productCode} does not exist`);
        }
        product.isDeleted = true;

        await ctx.stub.putState(productCode, Buffer.from(JSON.stringify(product)));
        console.info('============= END : changeProductOwner ===========');
    }

    /**
      * getCurrentUserId
      * To be called by application to get the type for a user who is logged in
      *
      * @param {Context} ctx the transaction context
      * Usage:  getCurrentUserId ()
     */
    async getCurrentUserId(ctx) {

        let id = [];
        id.push(ctx.clientIdentity.getID());
        var begin = id[0].indexOf("/CN=");
        var end = id[0].lastIndexOf("::/C=");
        let userid = id[0].substring(begin + 4, end);
        return userid;
    }

    /**
      * getCurrentUserType
      * To be called by application to get the type for a user who is logged in
      *
      * @param {Context} ctx the transaction context
      * Usage:  getCurrentUserType ()
     */
    async getCurrentUserType(ctx) {

        let userid = await this.getCurrentUserId(ctx);

        //  check user id;  if admin, return type = admin;
        //  else return value set for attribute "type" in certificate;
        if (userid == "admin") {
            return userid;
        }
        return ctx.clientIdentity.getAttributeValue("usertype");
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    static fromBuffer(buffer) {
        return Order.deserialize(Buffer.from(JSON.parse(buffer)));
    }
}

module.exports = ProductContract;