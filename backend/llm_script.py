import os
import sys
import base64
import json
from groq import Groq

# Check if there is a command-line argument
if len(sys.argv) > 1:
    encoded_code = sys.argv[1]
    # Add padding to the base64 string if needed
    missing_padding = len(encoded_code) % 4
    if missing_padding:
        encoded_code += '=' * (4 - missing_padding)
    try:
        code_prompt = base64.b64decode(encoded_code).decode('utf-8')
    except Exception as decode_error:
        print(f"Decoding error: {decode_error}")
        sys.exit(1)
else:
    print("No code provided.")
    sys.exit(1)

# Initialize the Groq client with the API key from the environment variable
try:
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
except Exception as e:
    print(f"Error initializing Groq client: {e}")
    sys.exit(1)

# Define a path for storing conversation history
history_file = "conversation_history.json"

# Function to load conversation history from a file
def load_conversation_history():
    if os.path.exists(history_file):
        with open(history_file, 'r') as file:
            try:
                return json.load(file)
            except json.JSONDecodeError:
                return []
    return []

# Function to save conversation history to a file
def save_conversation_history(conversation_history):
    with open(history_file, 'w') as file:
        json.dump(conversation_history, file)

# Initialize conversation history (load from file if exists)
conversation_history = load_conversation_history()

# Add the initial system message if it's a new session
if not conversation_history:
    conversation_history.append({
        "role": "system",
        "content": (
            "you are a cook and want to help people with recipes right now you're on a website where people will ask you to explain recipes, and your name is MasterChef"
        )
    })

# Add the user's input as a message to the conversation history
conversation_history.append({
    "role": "user",
    "content": code_prompt,
})

# Create chat completion using the provided Python code, including the previous conversation history
try:
    chat_completion = client.chat.completions.create(
        messages=conversation_history[-10:],  # Only keep the last 10 messages
        model="llama-3.1-8b-instant",
    )

    # Print the response from the LLM
    print(chat_completion.choices[0].message.content)

    # Append the model's response to the conversation history
    conversation_history.append({
        "role": "assistant",
        "content": chat_completion.choices[0].message.content,
    })

    # Save the updated conversation history to the file
    save_conversation_history(conversation_history)

except Exception as e:
    print(f"Error in LLM processing: {e}")
