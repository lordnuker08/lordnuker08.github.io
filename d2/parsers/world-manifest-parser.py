import json
import os

# read file
with open('../raw/world.manifest.en.json', 'r') as manifest:
    data=manifest.read()

# parse file
definitions = json.loads(data)

for type, values in definitions.items():
    directory = '../parsed/' + type
    if not os.path.isdir(directory):
        os.mkdir(directory)

    for typeItem, typeItemValue in values.items():
        with open(directory + '/' + typeItem + '.json', 'w') as outfile:
            json.dump(typeItemValue, outfile, separators=(',', ':'))