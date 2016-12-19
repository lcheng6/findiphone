#/bin/sh
zip -r findiphone.zip -xi ./node_modules config.js index.js package.json AlexaSkill.js recipes.js
aws lambda update-function-code --function-name findiPhoneMultiAccount --zip-file fileb://./findiphone.zip

rm ./findiphone.zip