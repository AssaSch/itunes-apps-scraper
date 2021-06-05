# ITunes applications scraper

ITunes scraper is written using node.js version 14.

Main considerations:
1. The main bottle-neck of this program is the http requests to get applications data, which node handles really good due to its async non-blocking architecture.
2. I decided to use the ability to send multiple apps ids in each request in order to decreaes number of requests neccessary. After testing the API I decided to send 100 apps ids in each request.
3. I also decided to keep the max in-flight requests to 100 in order not to cause the host server to block or throttle our calls.
4. I used open source package "natural" for tf-idf calculations.
5. I didn't use cache for the requests as I assumed each app id in file will be unique.

This scales quite well and in tests I did it handled file with 10,000 ids in 30 seconds and file with 100,000 ids in 12 minutes.

Things to do for scaling to million apps and more:
1. Save corpus to disk and not in memory.
2. After doing 1, we can split the part that in charge of sending requests and saving them to corpus and create several instances of it.
   Each instance will get batch of apps ids and all instances will save the data to the same corpus on disk.


In order to run the program:
1. install node runtime on your machine.
1. git clone https://github.com/AssaSch/itunes-apps-scraper.git
2. cd itunes-apps-scraper
3. npm install
4. node index.js \<path-to-file\> (you can use app.txt file in files folder).

Enjoy!
