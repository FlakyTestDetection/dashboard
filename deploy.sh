#!/bin/sh
# Get the deploy key by using Travis's stored variables to decrypt deploy_key.enc
ENCRYPTED_KEY_VAR="encrypted_${ENCRYPTION_LABEL}_key"
ENCRYPTED_IV_VAR="encrypted_${ENCRYPTION_LABEL}_iv"
ENCRYPTED_KEY=${!ENCRYPTED_KEY_VAR}
ENCRYPTED_IV=${!ENCRYPTED_IV_VAR}
openssl aes-256-cbc -K $encrypted_7d9c2b09c3a5_key -iv $encrypted_7d9c2b09c3a5_iv -in travis_key.enc -out travis_key -d

git config --global user.email "jon@jonbell.net"
git config --global user.name "Jonathan Bell"
chmod 600 travis_key
eval `ssh-agent -s`
ssh-add travis_key

npm run deploy

