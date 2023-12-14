// Consts
const NUM_PAGES_B4_IMG = 3;
const PAGES_ENTERED_INIT = 0;
const NUM_PAGES_B4_CONCLUSION = 10;

// Global variables
var pagesEntered = PAGES_ENTERED_INIT; // Start incrementing in next chapter

// Selectors
var pageAPI = $('.page-api');
var userPreferences = $('.container.user-preferences');
var pageStartAdventure = $('.page-start-adventure');
var pageNextChapter = $('.page-next-chapter');
var inputAPI = $('#inputAPI');
var submitAPI = $('#submit-api');
var formStartAdventure = $('#form-start-adventure');
var formNextChapter = $('#form-next-chapter');
var gptText = $('.gpt-text-generation');
var dalleImage = $('.dalle-image-generation');
var loadingSpinner = $('.loading-spinner');

// Variables
var characterName = '';
var characterJob = '';
var storyGenre = '';
var storySetting = '';
var storyLength = '';
var storySoFar = [];// Initialize storySoFar array to store the prompts, responses, and user choices

// MAIN - code start
// Wrap all code that interacts with the DOM in a call to jQuery to ensure that
// the code isn't run until the browser has finished rendering all the elements
// in the html.
$(document).ready(function () {

    // Initially hide content
    pageStartAdventure.hide();
    pageNextChapter.hide();
    userPreferences.hide();

    // Check for API key in localStorage
    var apiKey = localStorage.getItem('apiKey');
    if (apiKey) {
        console.log("Hiding API key form!");
        pageAPI.hide(); // hide the API key form
        console.log("Key is valid, continuing to next page..");
        userPreferences.show(); // show the first page
    } else {
        pageStartAdventure.hide(); // if no key present, hide everything and continue to the submit below
        pageNextChapter.hide();
    }

    // Make sure user preferences are stored in localStorage
    characterName = localStorage.getItem('character');
    characterJob = localStorage.getItem('job');
    storyGenre = localStorage.getItem('genre');
    storySetting = localStorage.getItem('setting');
    storyLength = localStorage.getItem('length');

    // Console log user preferences
    console.log("\nUser preferences loaded from localStorage!");
    console.log("Character Name: " + characterName);
    console.log("Character Job: " + characterJob);
    console.log("Story Genre: " + storyGenre);
    console.log("Story Setting: " + storySetting);
    console.log("Story Length: " + storyLength);

    // BUTTON/CLICK PROCESSING
    // STEP 1: API key submission
    // Test API for validity, Store API key on submission
    submitAPI.click(function (event) {
        event.preventDefault();
        apiKey = inputAPI.val();

        var prompt = 'Test'; // Dummy prompt to ensure API key is working

        fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: "system", content: prompt }],
                max_tokens: 25
            })
        })
            .then(response => {
                if (response.ok) {
                    // API key is valid, go ahead and set it to local storage
                    localStorage.setItem('apiKey', apiKey); // sets the API key in localStorage
                    pageAPI.hide(); // hides the form
                    userPreferences.show(); // shows the user preferences form
                } else {
                    $('<p style="color:red">API Key is not valid. Please try again.</p>').appendTo(pageAPI); // shows error message, might need to style later
                    inputAPI.val(''); // clears the API input form field

                    setTimeout(function () {
                        $('p').remove(); // remove the error message after delay
                    }, 2000);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                $('<p style="color:red">Something went wrong, please try again</p>').appendTo(pageAPI); // in case something else goes wrong during submission
            });
    });

    // Handle the start of the adventure
    formStartAdventure.submit(function (event) {
        event.preventDefault();
        console.log("\nStarting the adventure!");

        // Initialize
        pagesEntered = PAGES_ENTERED_INIT;

        // Hide the previous page
        pageStartAdventure.hide(); // on submit, hide the question and input form

        // Grab the user's response to the first question   
        var userResponse = $('#page-start-adventure-input').val(); // this is the user response for the first question

        // Call the initial story generation function, false indicating it's the first chapter
        generateStory(userResponse, false); // false indicating it's the first chapter, true means its a looping subsequent chapter function

        // Clear the input field
        $('#page-start-adventure-input').val(''); // Clear the input field

        // Show the next page
        pageStartAdventure.show(); // show the first page
        userPreferences.hide(); // hide the user preferences form   
    });

    // Handle subsequent chapters
    formNextChapter.submit(function (event) {
        event.preventDefault();
        // Keep track of how many chapters, pages the user has entered
        pagesEntered++;

        var userResponse = $('#page-next-chapter-input').val(); // this is the user response for all subsequent questions
        generateStory(userResponse, true); // true indicating it's not the first chapter
        $('#page-next-chapter-input').val('');
    });

    // STEP 2: User preferences
    // Handle user preferences submission
    $('#submit-preferences').click(function (event) {
        event.preventDefault();
        console.log("\nUser preferences submitted!");

        // Grab user preferences
        characterName = $('#inputName').val();
        characterJob = $('#inputJob').val();
        storyGenre = $('#inputGenre').val();
        storySetting = $('#inputSetting').val();
        storyLength = $('#inputLength').val();

        // Console log user preferences
        console.log("Character Name: " + characterName);
        console.log("Character Job: " + characterJob);
        console.log("Story Genre: " + storyGenre);
        console.log("Story Setting: " + storySetting);
        console.log("Story Length: " + storyLength);

        // Store user preferences in localStorage
        localStorage.setItem('character', characterName);
        localStorage.setItem('job', characterJob);
        localStorage.setItem('genre', storyGenre);
        localStorage.setItem('setting', storySetting);
        localStorage.setItem('length', storyLength);

        // Hide the user preferences form after submission
        userPreferences.hide();

        // Show the loading spinner and story text
        pageStartAdventure.show();

        // Call the initial story generation function
        generateStory();
    });

    // FUNCTIONS
    // STEP 3: Story generation
    
    // Function to generate story text
    function generateStory(userResponse, isNextChapter) {
        console.log("Attempting to generate story text!");

        // Define the prompt based on whether it's the initial story or a subsequent chapter
        // TODO: Fix the prompt for subsequent chapters to include the storySoFar array
        var prompt = isNextChapter ?
            `The user chose to: ${userResponse}. Repeat their choice to them in the following format: "You choose to ${userResponse}". Continue the story. Make sure to use the present tense. Don't go over 90 words before giving the user another choice in the following format: "You are walking down a dark alley when you see a shadowy figure. Do you [run away] or [approach the figure]?"` :
            `You are generating a choose-your-own-adventure style story for the user. Use present-tense. The user's name is ${characterName} and they are a ${characterJob}. The genre of this particular story will be ${storyGenre} and the setting is ${storySetting}. Make sure it's a second-person creative narrative. Use popular story-telling elements such as a climax, conflict, dramatic twist(s), resolution, etc. Make it about 90 words before giving the user a choice in the following format: "You are walking down a dark alley when you see a shadowy figure. Do you [run away] or [approach the figure]?"`;

        // The gpt text call to Open AI
        fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: "system", content: prompt }],
                max_tokens: 350
            })
        })
            .then(response => response.json())
            .then(data => {
                var storyText = data.choices[0].message.content.trim(); // this is where the response is stored in data
                typeWriter(storyText); // show the response text in the gptText element

                // Add the prompt and response to the storySoFar array
                storySoFar.push({ prompt: prompt, response: storyText, userResponse: userResponse });
                console.log(storySoFar);

                if (!isNextChapter) {
                    // Show the next page if it's the initial story
                    pageNextChapter.show();
                    pageStartAdventure.hide();

                    // Generate image every NUM_PAGES_B4_IMG chapters
                    if (!(pagesEntered % NUM_PAGES_B4_IMG)) {
                        generateImage(storyText); // generate the dall-e image function
                    }
                }
            });

        // Hide the previous page if it's not the initial story
        if (isNextChapter) {
            pageStartAdventure.hide();
            pageNextChapter.show();
        }
    }

    // Function to generate image, using the text from the generated story
    function generateImage(storyText) {
        dalleImage.hide(); // hide the previous image
        loadingSpinner.show() // show a CSS loading spinner, may want to add "loading image, please wait 10 seconds"

        // the dall-e API call is different than the GPT but uses the same key
        fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: storyText,
                n: 0, // how many images to generate
                size: '1024x1024' // the size of the image, i wonder if a smaller size takes less tokens?
            })
        })
            .then(response => response.json())
            .then(data => {
                // console.log(data); for development testing
                loadingSpinner.hide(); // once the image is generated, hide the spinner
                var imageUrl = data.data[0].url; // this is the image url that we'll feed the img container
                dalleImage.attr('src', imageUrl); // attaching the image url to the src attribute of this image element
                dalleImage.show(); // show the image. right now it briefly shows the previous image, so this needs to be fixed
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function typeWriter(text) {
        var words = text.split(' '); // Splits the gpt response into individual words
        var i = 0;
        gptText.empty(); // clears any existing content

        function addWord() {
            if (i < words.length) {
                gptText.append(words[i] + ' '); // Add the next word
                i++;
                setTimeout(addWord, 150) // time in ms between words
            }
        }
        addWord(); // calls the function to start
    }
})