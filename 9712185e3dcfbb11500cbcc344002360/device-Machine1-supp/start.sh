ARCH=`uname -m`
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ARCH=$ARCH docker-compose -f "${DIR}"/docker-compose.yml down
export DOCKER_CLIENT_TIMEOUT=120
export COMPOSE_HTTP_TIMEOUT=120
ARCH=$ARCH docker-compose -f "${DIR}"/docker-compose.yml up -d
echo "[INFO] Sleeping for 10 seconds, waiting for docker images to start."
sleep 10
docker exec -e "CORE_PEER_LOCALMSPID=suppMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@teco.com/msp" peer0.machine1.teco.com peer channel create -o orderer0.teco.com:7050 -c echannel -f /etc/hyperledger/configtx/artifacts/channel/echannel_tx.pb --tls --cafile /etc/hyperledger/configtx/artifacts/channel/crypto-config/ordererOrganizations/teco.com/tlsca/tlsca.teco.com-cert.pem --certfile /etc/hyperledger/fabric/tls/server.crt --keyfile /etc/hyperledger/fabric/tls/server.key --clientauth

sleep 2
docker exec -e "CORE_PEER_LOCALMSPID=suppMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@teco.com/msp" peer0.machine1.teco.com peer channel fetch 0 -o orderer0.teco.com:7050 -c echannel --tls --cafile /etc/hyperledger/configtx/artifacts/channel/crypto-config/ordererOrganizations/teco.com/tlsca/tlsca.teco.com-cert.pem --certfile /etc/hyperledger/fabric/tls/server.crt --keyfile /etc/hyperledger/fabric/tls/server.key --clientauth
sleep 2
docker exec -e "CORE_PEER_LOCALMSPID=suppMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@teco.com/msp" peer0.machine1.teco.com peer channel join -b echannel_0.block -o orderer0.teco.com:7050 --tls --cafile /etc/hyperledger/configtx/artifacts/channel/crypto-config/ordererOrganizations/teco.com/tlsca/tlsca.teco.com-cert.pem --certfile /etc/hyperledger/fabric/tls/server.crt --keyfile /etc/hyperledger/fabric/tls/server.key --clientauth
sleep 2
docker exec -e "CORE_PEER_LOCALMSPID=suppMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@teco.com/msp" peer1.machine1.teco.com peer channel fetch 0 -o orderer0.teco.com:7050 -c echannel --tls --cafile /etc/hyperledger/configtx/artifacts/channel/crypto-config/ordererOrganizations/teco.com/tlsca/tlsca.teco.com-cert.pem --certfile /etc/hyperledger/fabric/tls/server.crt --keyfile /etc/hyperledger/fabric/tls/server.key --clientauth
sleep 2
docker exec -e "CORE_PEER_LOCALMSPID=suppMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@teco.com/msp" peer1.machine1.teco.com peer channel join -b echannel_0.block -o orderer0.teco.com:7050 --tls --cafile /etc/hyperledger/configtx/artifacts/channel/crypto-config/ordererOrganizations/teco.com/tlsca/tlsca.teco.com-cert.pem --certfile /etc/hyperledger/fabric/tls/server.crt --keyfile /etc/hyperledger/fabric/tls/server.key --clientauth