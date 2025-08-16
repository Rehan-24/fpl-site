import sys

from WebInteractor import WebInteractor
from DataInteractor import DataInteractor
from FileInteractor import FileInteractor

verbose = False

#python src\fpl_management.py premier 11 -v -o
#python src\fpl_management.py championship 11 -v -a -o

def VERBOSE(print_str: str) -> None:
    global verbose
    if verbose:
        print(print_str)

def main():
    possible_leagues = {
        'championship': 850022,
        'premier': 723566,
    }
    help_str = ('Usage: fpl_management.py [LEAGUE_NAME] [GW] [OPTIONS]...\n'
                'MANDATORY\n'
                '  LEAGUE_NAME           the name of the league (championship, premier)\n'
                '  GW                    the gameweek just completed\n'
                'OPTIONS\n'
                '  -a, --add-average     expects the league to include an average bot\n'
                '  -o, --overwrite       overwrites the entire results file for the\n'
                '                          given league name\n'
                '  -v, --verbose         details the steps occuring during processing\n')

    args = sys.argv[1:]

    # Verify that there are enough arguments provided
    if len(args) < 2:
        print('Can you even read directions?')
        print(help_str)
        return 1

    league = args.pop(0)
    if league not in possible_leagues.keys():
        print('Error: The league given cannot be identified')
        print(help_str)
        return 1

    gameweek_str = args.pop(0)
    if not gameweek_str.isnumeric():
        print('You bastard, the gameweek is a number!')
        print(help_str)
        return 1

    # Process the optional arguments list
    overwrite_results = False
    include_bot = False

    while len(args) > 0:
        arg = args.pop(0)
        if arg == '-a' or arg == '--add-average':
            include_bot = True
        if arg == '-o' or arg == '--overwrite':
            overwrite_results = True
        if arg == '-v' or arg == '--verbose':
            global verbose
            verbose = True

    prospective_game_week = int(gameweek_str)
    league_id = possible_leagues[league]

    web_interactor = WebInteractor(league_id)
    data_interactor = DataInteractor()

    # Retrieve the (38 weeks || first week) of campaign data
    VERBOSE('Retrieving the (up to) 38 weeks of campaign data')
    campaign_data = web_interactor.get_campaign_data()

    VERBOSE('Generating the list of managers from the league campaign data')
    managers_list = data_interactor.get_managers_list(campaign_data)

    VERBOSE('Retrieving data particular to each manager')
    manager_data = web_interactor.get_manager_data(managers_list)

    VERBOSE('Creating the table by compiling and parsing all data')
    data_struct = data_interactor.process_all_data(
        prospective_game_week, campaign_data, manager_data, include_bot=include_bot
    )

    VERBOSE(f'Writing the {league} table to the {league} template')
    file_interactor = FileInteractor(league, data_struct)
    file_interactor.create_spreadsheet(prospective_game_week, overwrite_results=overwrite_results)

if __name__ == '__main__':
    main()
