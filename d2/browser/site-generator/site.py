import json
import os

fileEncoding = 'utf-8'
parsedResources = '../../parsed/'
scriptsSrc = '../data/'
features = ['DestinyLoreDefinition', 'DestinyRecordDefinition']
mapformat = u"[{},\"{}\"]"

def value_cleanup(value) :
    return value.replace("\"", "\\\"")


for feature in features:
    featurePath = parsedResources + feature + '/'
    files = os.scandir(featurePath)
    values = [];
    outputvar = u'['
    for file in files:
        with open(file, 'r') as datafile:
            data = datafile.read()
        definition = json.loads(data, encoding=fileEncoding)
        hash = definition['hash']
        displayProperties = definition["displayProperties"]
        name = value_cleanup(displayProperties["name"])
        if name:
            values.append(u'{{\"h\":\"{}\",\"n\":\"{}\"}}'.format(hash, name))
    outputvar = outputvar + u','.join(values) + u']'
    with open(scriptsSrc + feature + u'.json', 'w') as jsFile:
        jsFile.write(outputvar)
