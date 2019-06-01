import json
import os

fileEncoding = 'utf-8'
keyName = 'name'
keyModeType = 'modeType'

def value_cleanup(value) :
    return value.replace("\"", "\\\"")

def create_map_definition(variable_name, map_values) :
    return u'var ' + variable_name +  ' = new Map([' + u','.join(map_values)  + u']);'

def get_type_name_map(items, type_key_name) :
    all_values = []
    for item_type, item_values in items:
        if type_key_name in item_values:
            type_value = item_values[type_key_name]
            display_properties = item_values["displayProperties"]
            if keyName in display_properties :
                display_name = u'' + value_cleanup(display_properties[keyName])
            else:
                display_name = u'Unknown'
            value_map = mapformat.format( type_value, display_name )
            all_values.append(value_map)
    return all_values


# read file
with open('../raw/world.manifest.en.json', 'r') as manifest:
    data=manifest.read()

# parse file
definitions = json.loads(data, encoding=fileEncoding)

activityDefinitions = definitions.get("DestinyActivityDefinition")
activityModes = definitions.get("DestinyActivityModeDefinition")
classDefinition = definitions.get("DestinyClassDefinition")
genderDefinition = definitions.get("DestinyGenderDefinition")
raceDefinition = definitions.get("DestinyRaceDefinition")

mapformat = u"[{},\"{}\"]"

#activity type map
activityValues = []

#pvp activity map
pvpActivityValues = []
for type, values in activityDefinitions.items():
    if values["isPvP"] :
        pvpActivityValues.extend(values["activityModeTypes"])
    displayProperties = values["originalDisplayProperties"]
    if keyName in displayProperties :
        activityName = u'' + value_cleanup(displayProperties[keyName])
    else:
        activityName = u'Unknown'
    activityValueMap = mapformat.format( type, activityName )
    activityValues.append(activityValueMap)

pvpActivityValues = set(pvpActivityValues)
pvpActivityValuesFormatted = []
for pvpActivityValue in pvpActivityValues :
    pvpActivityValuesFormatted.append(str(pvpActivityValue))

pvpActivityModeValues = u'var pvpActivities=[' + u','.join(pvpActivityValuesFormatted) + u'];'

activityModeValues = get_type_name_map(activityModes.items(), u'modeType')
classValues = get_type_name_map(classDefinition.items(), u'classType')
genderValues = get_type_name_map(genderDefinition.items(), u'genderType')
raceValues = get_type_name_map(raceDefinition.items(), u'raceType')

with open('../../maps.js', 'w', encoding=fileEncoding) as outfile:
    outfile.write( create_map_definition(u'activityTypeMap', activityValues))
    outfile.write(u'\n')
    outfile.write( create_map_definition(u'activityModeTypeMap', activityModeValues) )
    outfile.write(u'\n')
    outfile.write( create_map_definition(u'classTypeMap', classValues) )
    outfile.write(u'\n')
    outfile.write( create_map_definition(u'genderTypeMap', genderValues) )
    outfile.write(u'\n')
    outfile.write( create_map_definition(u'raceTypeMap', raceValues) )
    outfile.write(u'\n')
    outfile.write(pvpActivityModeValues)

print('Done')