# ATC Map

This is a submission for the [Google Immersive Geospatial Challenge](https://googlesimmersive.devpost.com/) by [Dylan Babbs](https://twitter.com/dbabbs) and [Byron Hsu](https://twitter.com/0xByron).

## Running the app

This is a React web app.

Create an `.env.local` file and add a Google Maps key:

```
NEXT_PUBLIC_GMAPS_API_KEY=XXXX
```

Install dependencies and create a local server:

```
yarn
yarn dev
```

This will start the front end companion app (for the pilot).

## Inspiration

I spent 2021 learning how to fly and getting my Private Pilot license. One of the tasks that I always struggled with was radio communication with air traffic control. Pilots communicate with air traffic control on both the ground and in the air to hear important directions. This communication is done via radio, which sometimes makes the communication difficult to understand due to quick talking and low quality audio. It's easy for a pilot to miss key information when communicating over radio with ATC (Air traffic control).

Miscommunication between pilots and ATC is a major safety risk, as lack of coordination at airports can be a deadly and fatal problem. The [Tenerife Airport Disaster](https://en.wikipedia.org/wiki/Tenerife_airport_disaster), the deadliest accident in aviation history, resulting in the deaths of 583 people, didn't even take place in the air. It took place on the ground when two planes collided on the runway. This risk of collision is still very pertinent today. In January of 2023, [two planes nearly collided at JFK airport](https://www.nytimes.com/2023/01/15/us/jfk-planes-delta-american-faa.html) on the ground during takeoff, which surely would have been one of the worst aviation disasters in recent time.

## What it does

We built a companion app for pilots to use in the cockpit in order to improve the pilot's ability to receive, parse, and understand instructions from ATC while on the ground.

## How it works

**1. Automatic transcription of radio audio using AI**
We listen to live radio signals to transcribe audio into text

**2. Key term extraction and semantic interpretation of aviation terms**
Using the transcribed audio in text format, we can extract key aviation terms and meaning in order to make sense of the instructions given to the pilot. We extract terms like starting position, taxiway instructions, runway takeoff instructions

**3. Information Visualization**
Our companion app provides a usable information visualization of the required instructions to complete from ATC. We are able to visualize the path and route the pilot is supposed to take across the complicated airport from starting position to takeoff position.

The visualization provides a top-down overview of the required route and a turn-by-turn immersive view, similar to what you would see in Google Maps mobile app.

## How we built it

This companion app is designed to be use on an iPad inside of an airplane cockpit. The app is a front-end web app built with React. For the maps technology, we used **Google Maps 3D Photorealistic Imagery** inside of deck.gl. For the AI technology, we made use of OpenAI's GPT-4 API.

We created a sample map of Isla Grande Airport in San Juan, Puerto Rico. Using Dijstrka's algorithm, we are able to route from point A->B on a network graph.

## Challenges we ran into

Interpreting the audio to parse the semantic aviation terms was a little bit of a challenge.

## Accomplishments that we're proud of

We're proud of creating a project that can help save lives and make aviation a safer environment

## Why Sustainability Category?

We chose the sustainability category because our project aims to create a safer environment for all humans involved in aviation.
