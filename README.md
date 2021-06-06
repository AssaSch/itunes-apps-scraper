# ITunes applications scraper

ITunes scraper is written using node.js version 14.
It consists of the main module "ITunesScraper" which uses modules "DataFetcher" and "DataAggregator".

Main considerations:
1. The main bottle-neck of this program is the http requests to get applications data, which node handles really well due to its async non-blocking architecture.
2. I decided to use the ability to send multiple apps ids in each request in order to decrease the number of requests necessary. After testing the API I decided to send 100 apps ids in each request.
3. I also decided to keep the max in-flight requests to 100 in order not to cause the host server to block or throttle our calls.
4. I used the open source package "natural" for tf-idf calculations.
5. I didn't use cache for the requests as I assumed each app id in the file will be unique.

Things to do for scaling to million apps and more:
1. Run each one of the 3 modules in different process/docker.
2. Make sure to save corpus to disk and not in memory.
3. Scale each one of the processes/dockers according to bottle-necks. In our use-case we will probably need to create more instances of DataFetcher process/docker to handle http requests better.


In order to run the program:
1. install node runtime on your machine.
1. git clone https://github.com/AssaSch/itunes-apps-scraper.git
2. cd itunes-apps-scraper
3. npm install
4. node index.js \<path-to-file\> (there is an example file in: "files/apps.txt").

Enjoy!
