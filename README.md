![Title-image](https://github.com/nitish1310/Personalized-email-access-service-based-on-voice-response/blob/master/Images/Title-Image.jpg)

# Personalized Email Access Service Based On Voice Response
This reposity contains the code for Personalized email access service based on voice response.

## Introduction:

The system integrates Google's text-to-speech API, and Machine Learning to create the personalized email access service based on voice response. The platform is based on express JS, React JS, React Native, machine learning technology, Google Vision API, Google Dialogflow and Google Cloud text-to-speech API. Developing React Native app (Android & iOS) and web platform of the application.

Google Cloud Text-to-Speech converts text into human-like speech in more than 180 voices across 30+ languages and variants. It applies groundbreaking research in speech synthesis (WaveNet) and Google's powerful neural networks to deliver high-fidelity audio. With this easy-to-use API, you can create lifelike interactions with your users that transform customer service, device interaction, and other applications.

![Google-Text-to-Speech-image](https://github.com/nitish1310/Personalized-email-access-service-based-on-voice-response/blob/master/Images/Google-Text-to-Speech-API.JPG)

The Actions on Google integration in Dialogflow allows interoperability between the Google Assistant and Dialogflow, letting you use Dialogflow agents as conversational fulfillment for your Actions. It give users new ways to interact with your product by building engaging voice and text-based conversational interfaces, such as voice apps and chatbots, powered by AI. Connect with users on your website, mobile app, the Google Assistant, Amazon Alexa, Facebook Messenger, and other popular platforms and devices.

![Dialogflow-image](https://github.com/nitish1310/Personalized-email-access-service-based-on-voice-response/blob/master/Images/Dialogflow.JPG)

Google Cloud’s Vision API offers powerful pre-trained machine learning models through REST and RPC APIs. Assign labels to images and quickly classify them into millions of predefined categories. Detect objects and faces, read printed and handwritten text, and build valuable metadata into your image catalog. Google Vision can detect whether you’re a cat or a human, as well as the parts of your face. It tries to detect whether you’re posed or doing something that wouldn’t be okay for Google Safe Search—or not. It even tries to detect if you’re happy or sad.

![Google-Vision-API-image](https://github.com/nitish1310/Personalized-email-access-service-based-on-voice-response/blob/master/Images/Google-Vision-API.JPG)

Gmail API help us to read and send messages, manage drafts and attachments, search threads and messages, work with labels, setup push notifications, and manage Gmail settings. 

![Gmail-API-image](https://github.com/nitish1310/Personalized-email-access-service-based-on-voice-response/blob/master/Images/Gmail-API.JPG)

## Problem Definition:
In this project, I am planning to analyze the below problem statements:

### Problem Statement 1: Fetch all email from Gmail using Google’s Gmail API and Convert text to speech of emails using Google’s Cloud text-to-speech API:
Read the sender’s name from email. Read the subject matter and remove ‘RE’ and ‘FW’ from received emails. Read the email date and time (up to min). Save all emails in local memory so that it can be access during offline. Customize pitch rate, speed information, voice gender and type, audio device profile and language.

### Problem Statement 2: Read attachment details:
It should the name of attachment, type & size along with the email content. Using Google Vision API assign labels to images and quickly classify them into millions of predefined categories. Detect objects and faces, read printed and handwritten text, and build valuable metadata into your image catalog.

### Problem Statement 3: Search email using various catagories:
Search email using various catagories like sender’s name, email subject, date. It will tell how many emails received from user if asked. 

### Problem Statement 4: Craete Voice assistant using Dialogflow and integrate with this application:
Create voice assistant using Dialogflow and integrate voice assistant in react JS environment. Also integrated voice assistant with email application. Voice assistant fetch all the emails based on user's command. Voice assistant search emails based on user's command.
It will read all emails as well as display it in tabular form. Voice assistant respond and perform specific task based on user’s question and training of voice assistant.



 








