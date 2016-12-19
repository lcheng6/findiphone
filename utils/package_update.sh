#/bin/sh
zip -r iphonealarm.zip -xi ./node_modules config.js index.js package.json AlexaSkill.js 
aws lambda update-function-code --function-name findiphone --zip-file fileb://./findiphone.zip
rm ./findiphone.zip