# imports
import time
import requests

# function to send a GET request to the site
def send_ping(url):
    try: 
        # send GET
        response = requests.get(url)
        
        # check status of response
        if response.status_code == 200:
            print(f"All good @ {url}, Status Code: 200")
        else:
            print(f"Failed @ {url}, Status Code: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"Error while pinging {url}: {e}")
        
# main fxn
def main():
    # url for page
    fpl_url = "https://tfpl.vercel.app/managers"
    
    # time interval between pings
    ping_interval = 300 # 300 sec = 5 minutes
    
    # pinging
    print(f"Starting to ping {fpl_url}")
    
    while True:
        send_ping(fpl_url)
        # wait interval
        time.sleep(ping_interval)
        
if __name__ == "__main__":
    main()    
    