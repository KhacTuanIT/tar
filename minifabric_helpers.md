## Initial network

```bash
minifab netup -o supply.teco.com -i 2.2 -l node -s couchdb -e true
```

## Create channel

```bash
minifab create,join -c ecsupply
minifab channelquery

-> edit file `vars/Vku_config.json`
-> "max_message_count": 50
-> "timeout": "20s"

minifab channelsign,channelupdate
```

## Update Anchor & Profile generate

```bash
minifab anchorupdate,profilegen
```

## Install & Update chaincode

### Install new chaincode

```bash
minifab ccup -n teco -l node -v 1.0 -d true -p '"initProductLedger"'
```

```bash
minifab ccup -n teco -l node -v 1.0 -d true -p '"initProductLedger"'
```


### Upgrade chaincode with 1 command

```bash
# Upgrade with default (include initialize)
minifab ccup -n teco -v 1.1 -l node
# Upgrade without initialize
minifab ccup -n teco -v 1.1 -l node -d false -p ''
```

### Manual Upgrade chaincode

```bash
minifab install -n teco -v 1.1 -l node
minifab approve
minifab commit
minifab initialize # Optional
minifab discover
minifab channelquery
```

### Test query invoke

```bash
minifab invoke -n teco -p '"queryProduct","PR01"'
```

```bash
minifab invoke -n teco -p '"createProductLedger","{name:}"'
```

