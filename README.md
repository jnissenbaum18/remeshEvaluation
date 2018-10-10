Remesh Evaluation readme.
Hours spent: 16

Project requirements and status:

## Basic Requirements

Given this sqlite database for users, questions, messages, and votes, design an API server.

* Users have an id, age, sex, income, and living_environment attribute.
* Questions have an id and text.
* Messages have an id, text, creator_id, and question_id.
* Votes have an id, user_id, and message_id.

Write code that accepts GET parameters to group messages by any combination of users, ages, sexes, incomes, or living_environments.

For example, given parameters of "Male" users aged "18-24" and "65+" with incomes "<20,000" and living in "Urban" and "Rural" environments, your function would return messages which were voted on only by users fitting those parameters. Think of search filters and parameters.

Please provide instructions on how to test this server and/or where this is deployed so we can use your API.

Please describe trade offs in your current approach and how you might prepare this server for production.

## Install and Usage

The repository can be run by simply cloning into an empty directory, running "npm install" then "npm start". Navigate to localhost:3000 to access the server. The server has four routes that have been built: /query/users, /query/messages, /query/questions and /query/votes. 

For the /messages and /questions routes, the server is expecting a query param for text to match a message or question to. So if you wanted to search for a message that has text matching "as" you would navigate to:
http://localhost:3000/query/messages?text=as

For the /votes route, the server is expecting a query param for id to search the votes table for and then match a message to it. Example:
http://localhost:3000/query/votes?id=2

The /users route is the most complicated, it can accept multiple query parameters in multiple combinations.

To query for age, the server accepts a single age such as 27, it also accepts an age range such as 40-49, and it can accept multiple combinations of either such as 42,54,18-24,65+. Example:
http://localhost:3000/query/users?age=42,54,18-24,65+

To query for income, the server accepts a single income number such as 18545, an income range such as 40000-50000 (note how there are no comma's or escape characters), and it can accept multiple combinations of either such as 14500,40000-50000. Example:
http://localhost:3000/query/users?income=14500,40000-50000

To query for living_environment, the server accepts any combination of "Suburban", "Urban" or "Rural" (capitalization does not matter). Example:
http://localhost:3000/query/users?living_environment=urban,Rural

To query for gender, the server accepts any combination of "Male", "M", "Female", "F" (capitalization does not matter). Example
http://localhost:3000/query/users?sex=M,female

Any of these queries can be chained together in the url separated by &'s. Example:
http://localhost:3000/query/users?income=20000-30000,50000&age=26,30-39&sex=M,Female&living_environment=Rural

## Thoughts about approach and prod prep.

As I was working through the challenge, I noticed a few oddities. First, the votes table seems to be useless in that the only data it's storing is its own id and the id of a message. Without knowing how the vote was cast, there really is no point to keeping this table. The requirements did not mention anything about votes, so it wasn't that impactful. Second, and by far the most frustrating aspect of the database, is how age and income are being stored. By saving ranges in a single field instead of having a max and min, it rules out the possibility of easily executing a query to match a number to that range. Instead, I had to design utility functions to preprocess the data and match them to the exact strings within the data fields. This didn't feel right for me at the time and I tried looking for a possible alternative, but I couldn't find one. If I had the choice, I would definitely reformat the data to break out those number ranges.

Regarding a possible deployment to prod, I have a few thoughts. The first potential problem I would want to address is the use of the .all function. Since .all returns every single matched row at once, this can be very underperformant for large queries. Optimally, I would want time to rewrite this functionality to use the .each function and handle every result individually, thus cutting down on the instantaneous server load. I also would want to test the endpoints further to look for bugs and edge cases. Lastly, the queries themselves could probably be streamlined and tailored to fit the specific needs of the website or service it's trying to serve. Ultimately, if the dataset isn't vastly larger and the userbase isn't numbering in the thousands, I'd say the API is in a decent spot as is.