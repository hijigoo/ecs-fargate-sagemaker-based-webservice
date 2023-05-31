from constant import *
import json

ko_pokedex_id_2_info = "ko-pokedex-id-2-info.json"

pokedex_datasets_from_id = {}

def read_dex(filepath):
    with open(filepath, 'r', encoding='UTF-8') as infile:
        data = json.load(infile)
    return data

def preload_pokedex_datasets():
    global pokedex_datasets_from_id
    global en_pokedex_datasets_from_id

    pokedex_datasets_from_id = read_dex(STATIC_DIR + ko_pokedex_id_2_info)

def get_pokemon_by_id(id):
    if not bool(pokedex_datasets_from_id):
        preload_pokedex_datasets()
    return pokedex_datasets_from_id[str(id)]

