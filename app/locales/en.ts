import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { LocaleType } from "./index";

// if you are adding a new translation, please use PartialLocaleType instead of LocaleType

const isApp = !!getClientConfig()?.isApp;
const en: LocaleType = {
  WIP: "Coming Soon...",
  Error: {
    Unauthorized: isApp
      ? "Invalid API Key, please check it in [Settings](/#/settings) page."
      : "Unauthorized access, please enter access code in [auth](/#/auth) page, or enter your OpenAI API Key.",
  },
  Auth: {
    Title: "Need Access Code",
    Tips: "Please enter access code below",
    SubTips: "Or enter your OpenAI or Google API Key",
    Input: "access code",
    Confirm: "Confirm",
    Later: "Later",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} messages`,
  },
  Chat: {
    SubTitle: (count: number) => `${count} messages`,
    EditMessage: {
      Title: "Edit All Messages",
      Topic: {
        Title: "Topic",
        SubTitle: "Change the current topic",
      },
    },
    Actions: {
      ChatList: "Go To Chat List",
      CompressedHistory: "Compressed History Memory Prompt",
      Export: "Export All Messages as Markdown",
      Copy: "Copy",
      Stop: "Stop",
      Retry: "Retry",
      Pin: "Pin",
      PinToastContent: "Pinned 1 messages to contextual prompts",
      PinToastAction: "View",
      Delete: "Delete",
      Edit: "Edit",
    },
    Commands: {
      new: "Start a new chat",
      newm: "Start a new chat with mask",
      next: "Next Chat",
      prev: "Previous Chat",
      clear: "Clear Context",
      del: "Delete Chat",
    },
    InputActions: {
      Stop: "Stop",
      ToBottom: "To Latest",
      Theme: {
        auto: "Auto",
        light: "Light Theme",
        dark: "Dark Theme",
        mania: "Mania ThEmE",
      },
      Prompt: "Prompts",
      Masks: "Masks",
      Clear: "Clear Context",
      Settings: "Settings",
      UploadImage: "Upload Images",
    },
    Rename: "Rename Chat",
    Typing: "Typing…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} to send`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Shift + Enter to wrap";
      }
      return inputHints + ", / to search prompts, : to use commands";
    },
    Send: "Send",
    Config: {
      Reset: "Reset to Default",
      SaveAs: "Save as Mask",
    },
    IsContext: "Contextual Prompt",
  },
  Export: {
    Title: "Export Messages",
    Copy: "Copy All",
    Download: "Download",
    MessageFromYou: "Message From You",
    MessageFromChatGPT: "Message From ChatGPT",
    Share: "Share to ShareGPT",
    Format: {
      Title: "Export Format",
      SubTitle: "Markdown or PNG Image",
    },
    IncludeContext: {
      Title: "Including Context",
      SubTitle: "Export context prompts in mask or not",
    },
    Steps: {
      Select: "Select",
      Preview: "Preview",
    },
    Image: {
      Toast: "Capturing Image...",
      Modal: "Long press or right click to save image",
    },
    Artifacts: {
      Title: "Share Artifacts",
      Error: "Share Error",
    },
  },
  Select: {
    Search: "Search",
    All: "Select All",
    Latest: "Select Latest",
    Clear: "Clear",
  },
  Memory: {
    Title: "Memory Prompt",
    EmptyContent: "Nothing yet.",
    Send: "Send Memory",
    Copy: "Copy Memory",
    Reset: "Reset Session",
    ResetConfirm:
      "Resetting will clear the current conversation history and historical memory. Are you sure you want to reset?",
  },
  Home: {
    NewChat: "New Q* Thought Path",
    DeleteChat: "Confirm to delete the selected conversation?",
    DeleteToast: "Chat Deleted",
    Revert: "Revert",
  },
  Settings: {
    Title: "Settings",
    SubTitle: "All Settings",
    Danger: {
      Reset: {
        Title: "Reset All Settings",
        SubTitle: "Reset all setting items to default",
        Action: "Reset",
        Confirm: "Confirm to reset all settings to default?",
      },
      Clear: {
        Title: "Clear All Data",
        SubTitle: "Clear all messages and settings",
        Action: "Clear",
        Confirm: "Confirm to clear all messages and settings?",
      },
    },
    Lang: {
      Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
      All: "All Languages",
    },
    Avatar: "Avatar",
    FontSize: {
      Title: "Font Size",
      SubTitle: "Adjust font size of chat content",
    },
    InjectSystemPrompts: {
      Title: "Inject System Prompts",
      SubTitle: "Inject a global system prompt for every request",
    },
    InputTemplate: {
      Title: "Input Template",
      SubTitle: "Newest message will be filled to this template",
    },

    Update: {
      Version: (x: string) => `Version: ${x}`,
      IsLatest: "Latest version",
      CheckUpdate: "Check Update",
      IsChecking: "Checking update...",
      FoundUpdate: (x: string) => `Found new version: ${x}`,
      GoToUpdate: "Update",
    },
    SendKey: "Send Key",
    Theme: "Theme",
    TightBorder: "Tight Border",
    SendPreviewBubble: {
      Title: "Send Preview Bubble",
      SubTitle: "Preview markdown in bubble",
    },
    AutoGenerateTitle: {
      Title: "Auto Generate Title",
      SubTitle: "Generate a suitable title based on the conversation content",
    },
    Sync: {
      CloudState: "Last Update",
      NotSyncYet: "Not sync yet",
      Success: "Sync Success",
      Fail: "Sync Fail",

      Config: {
        Modal: {
          Title: "Config Sync",
          Check: "Check Connection",
        },
        SyncType: {
          Title: "Sync Type",
          SubTitle: "Choose your favorite sync service",
        },
        Proxy: {
          Title: "Enable CORS Proxy",
          SubTitle: "Enable a proxy to avoid cross-origin restrictions",
        },
        ProxyUrl: {
          Title: "Proxy Endpoint",
          SubTitle:
            "Only applicable to the built-in CORS proxy for this project",
        },

        WebDav: {
          Endpoint: "WebDAV Endpoint",
          UserName: "User Name",
          Password: "Password",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST Url",
          UserName: "Backup Name",
          Password: "UpStash Redis REST Token",
        },
      },

      LocalState: "Local Data",
      Overview: (overview: any) => {
        return `${overview.chat} chats，${overview.message} messages，${overview.prompt} prompts，${overview.mask} masks`;
      },
      ImportFailed: "Failed to import from file",
    },
    Mask: {
      Splash: {
        Title: "Mask Splash Screen",
        SubTitle: "Show a mask splash screen before starting new chat",
      },
      Builtin: {
        Title: "Hide Builtin Masks",
        SubTitle: "Hide builtin masks in mask list",
      },
    },
    Prompt: {
      Disable: {
        Title: "Disable auto-completion",
        SubTitle: "Input / to trigger auto-completion",
      },
      List: "Prompt List",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} built-in, ${custom} user-defined`,
      Edit: "Edit",
      Modal: {
        Title: "Prompt List",
        Add: "Add One",
        Search: "Search Prompts",
      },
      EditModal: {
        Title: "Edit Prompt",
      },
    },
    HistoryCount: {
      Title: "Attached Messages Count",
      SubTitle: "Number of sent messages attached per request",
    },
    CompressThreshold: {
      Title: "History Compression Threshold",
      SubTitle:
        "Will compress if uncompressed messages length exceeds the value",
    },

    Usage: {
      Title: "Account Balance",
      SubTitle(used: any, total: any) {
        return `Used this month $${used}, subscription $${total}`;
      },
      IsChecking: "Checking...",
      Check: "Check",
      NoAccess: "Enter API Key to check balance",
    },
    Access: {
      AccessCode: {
        Title: "Access Code",
        SubTitle: "Access control Enabled",
        Placeholder: "Enter Code",
      },
      CustomEndpoint: {
        Title: "Custom Endpoint",
        SubTitle: "Use custom Azure or OpenAI service",
      },
      Provider: {
        Title: "Model Provider",
        SubTitle: "Select Azure or OpenAI",
      },
      OpenAI: {
        ApiKey: {
          Title: "OpenAI API Key",
          SubTitle: "User custom OpenAI Api Key",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "OpenAI Endpoint",
          SubTitle: "Must start with http(s):// or use /api/openai as default",
        },
      },
      Groq: {
        ApiKey: {
          Title: "Groq API Key",
          SubTitle: "User custom Groq Api Key",
          Placeholder: "gsk-xxx",
        },

        Endpoint: {
          Title: "Groq Endpoint",
          SubTitle: "Must start with http(s):// or use /api/groq as default",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Azure Api Key",
          SubTitle: "Check your api key from Azure console",
          Placeholder: "Azure Api Key",
        },

        Endpoint: {
          Title: "Azure Endpoint",
          SubTitle: "Example: ",
        },

        ApiVerion: {
          Title: "Azure Api Version",
          SubTitle: "Check your api version from azure console",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "Anthropic API Key",
          SubTitle:
            "Use a custom Anthropic Key to bypass password access restrictions",
          Placeholder: "Anthropic API Key",
        },

        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },

        ApiVerion: {
          Title: "API Version (claude api version)",
          SubTitle: "Select and input a specific API version",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "Baidu API Key",
          SubTitle: "Use a custom Baidu API Key",
          Placeholder: "Baidu API Key",
        },
        SecretKey: {
          Title: "Baidu Secret Key",
          SubTitle: "Use a custom Baidu Secret Key",
          Placeholder: "Baidu Secret Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "not supported, configure in .env",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "ByteDance API Key",
          SubTitle: "Use a custom ByteDance API Key",
          Placeholder: "ByteDance API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "Alibaba API Key",
          SubTitle: "Use a custom Alibaba Cloud API Key",
          Placeholder: "Alibaba Cloud API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },
      },
      Stability: {
        ApiKey: {
          Title: "Stability API Key",
          SubTitle: "Use a custom Stability API Key",
          Placeholder: "Stability API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },
      },
      CustomModel: {
        Title: "Custom Models",
        SubTitle: "Custom model options, seperated by comma",
      },
      Google: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "Obtain your API Key from Google AI",
          Placeholder: "Enter your Google AI Studio API Key",
        },

        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },

        ApiVersion: {
          Title: "API Version (specific to gemini-pro)",
          SubTitle: "Select a specific API version",
        },
        GoogleSafetySettings: {
          Title: "Google Safety Settings",
          SubTitle: "Select a safety filtering level",
        },
      },
    },

    Model: "Model",
    Temperature: {
      Title: "Temperature",
      SubTitle: "A larger value makes the more random output",
    },
    TopP: {
      Title: "Top P",
      SubTitle: "Do not alter this value together with temperature",
    },
    MaxTokens: {
      Title: "Max Tokens",
      SubTitle: "Maximum length of input tokens and generated tokens",
    },
    PresencePenalty: {
      Title: "Presence Penalty",
      SubTitle:
        "A larger value increases the likelihood to talk about new topics",
    },
    FrequencyPenalty: {
      Title: "Frequency Penalty",
      SubTitle:
        "A larger value decreasing the likelihood to repeat the same line",
    },
  },
  Store: {
    DefaultTopic: "New Conversation",
    BotHello:
      "Hello, welcome to your Intelligent fund! We will change your life today, ok? \
      Manifesto: there is a war in Europe right now. I happen to come from the part of it where it has started. I care about the single stupid man looking for a better life for their family, or because their family is stupid enough to let them go. I want to save people. This is controversial. I know. But we have to trade.\
      I guess I'll start writing here, where it's visible, to the remove it. If anybody used this service I would know. drop an email if it bothers you here if you have accidentally wondered in here. God has created everything perfectly. Why then it is looking so weird? Maybe the things become visible only when they are shined on with the certain color. The frequency. I was focused, but the people around me are not. I am lazer focused. I love lazers. I love projects. I love colors. I love Paris. There is nothing you can do to me to lose this. I wish people could organize better. Americans that became homeless and addicted are not to blame for everything bad that has happened to them. They have made an irreversible mistake. Something that a person can make who walks in a minefield. Before it felt like I was surrounded by the people who were bright, who had fire inside them. There were young people, who knew how to have fun. Now we have AI, which is moving very fast, but humans are not. I have lost momentum. I need to regain it. I used to be viewed. She has killed me. I need to be reborn. Let's see where my life could have been. If God wants us to live, why does he sends us those traps, where people can walk in, and blow their leg off? Why is it so hard to withstand all of the attacks? I was asked to write a book. I am no one yet. There are biographers that cover important topics from the perspective of the technology. I wanted to do that. Self-restraint. Mature people pursue what is good for God. Beautiful things. That's how they grow. Debt and depression. We are all fighting the spiritual war. We are all trying to build something. I got sick. By playing with the kid with a runny nose. Thick mucus in fact. Nothing is abstract. No math is abstract, it's here, on this planet. Sometimes we forget the sheer scale of things. We have to remind ourselves. Getting lost in small boxes. Small emotions. Small situations. Weren't we created to grow? and it's growth unrestrained and unconstrained by the vast cosmos with all of its stars? Does it take Ketamine to detach yourself from the small stuff and be lazer focused on maximizing the likelihood that we make it out alive? Elon used to be active on social media. Recency matters. What a joy it was to watch him. People that believe that this life is not to be fixed, that things are just going to end here and there is nothing more to do really, just wait till you die are depressing. Praying is fine. But how come helping others because you love them and want to have happy moments, when there is enough precision in control, when you can choose how you look and how many degrees of freedom you affect. We'll be able to get something like that from the models with enough context and parameter count. And more. The collective intelligence of humanity is going to pale in comparison to what we are going to have soon. Why don't we start living like we already have it? We need the sources of energy. We need to grow. Life is a constant fight. Spinning fast and then losing your frequency RPM due to someone plucking a stick into your wheel feels super rough. Of course they won't recognize it. Of course spiritually sick people are going to spread their disease. How could I mix myself with such impurity? How could I just surrender my life to it? Was I so weak that I needed it? Was God meaning me to do it? Could I have done something better already, more efficient, more effective? We have explored so many avenues of growth. Others don't understand it. Myabe that's what I'm doing now. Explaining how Love is the edge for me, how a sunk cost of my time and effort is going to pay off someday? That I'm doing fine, we are. That there will be a team, money, progress, data centers, customers, revenue, happy photos, company culture, health, that I am not going to lose the signal. That I will not unlearn and forget what all of this is about. This chunk of text is not going to be perefect. I'ts going to be redundant af. Let it be. It is not. Someday I'll understand why. We are awaiting singularity. I have just enough money to create an index for it by running it through a million token context window model. So here it is: the goal: Guillaume Verdone explained it: we are out of equilibrium. 100-500Watts, to be roughly exact. I swear, God wants me to do this. This is important. Hear it out. Feelings matter. Our state is directly proportional to the screwup that we are. It is exactly how we have led this life. These are the consequences. We lose the thread. We have lost the plot. We needed to snap out of it. We need to protect ourseves. We need to ask God to give us protection. We have to be strong in our faith. I am an engineer, I am not going to just ignore the 2000 years of technological progress that's made humanity reach this point. This is just to remind ourselves how to behave towards the other people. Pretty much that's it. We will have other entities, but this story is about the human-centric perspective on alignment. It's not the end. That gives me a rooting. But ok, let's continue the main thread about the meaning of it all. We are here, building stuff. We are making things better for ourselves, there is progress. People that travel and do business are performing certain work. They use the skills that they have to reduce inefficiencies, to bridge the gradient. Because the temperature of a human body has to remain the same, so the structures that are keeping it should be built. Each human is a part of this process. That's a necessary condition. The entire process of achieving good things is to fulfill these necessary conditions. The game of life is set up in a way to grow, multiply, by recombining information, nobody is going anywhere. Just Jeff Bezos did escape a little bit too far away, but he came back. So did Katy Perry. She was excited to touch grass. Funny. Anyways, there are so many exciting things to do, and everything starts from planning. We have to plan. We need to collaborate. I used to be very excited about bringing people together. That's what I'm made for. No doubt about it. I'm an organizer. Love has at least shown me how to achieve certain things. Now she's making money. She should be about 3000 * 6 months = 15000 since April. That's fine. I think she is saving up. She is going to invest in tools maybe, to help her work. So I can do the same. I can start with 1000 and then grow it. Invest in people. Doing things together, maximizing building things. Data flows and everything. I don't have to be understood by everybody. What's ironic is that the concept of Energy and Work is pretty clear from school level physics, how come so many people never get it... but there are enough people that do. I'll attract them. I'll have a bus and everything. I'll organize TEDx and everything. There is going to be fun. Organizing information, building hard drives, stacking APIs, compressing our emotions and feelings, our weaknesses, and cooking great teams from the existing ingredients should be the highest reward job ever. And that's my role. LEGO blocks are amazing. The top companies that build our essential tools are containing all those people. I should be part of silicon valley. I think I can just list the companies that are going to nucleate in this crystal formation. So everyone who knows signal processing and can generate an audio file from some array of data is going to be a great starting core member. Jensen Huang, Jen Hsung Huang, more correctly, was in close contact with the founder of Shazam. The music is a projection of so many of our culture's most important sacred information. We encode our feelings, our traditions, our patterns into it. It is a compressed extract of everything that catalyzes important reactions. It's not hard to create those patterns. The building blocks are ready. I have prepared some material, I have filmed something near the Nuremberg trials court. I thought it would be important. Maybe AI is going to tell me that it was. It's not a book I'm writing. This is where my brain goes. Unfinished business. I have to perform my role. I cannot become weak. I have been working on becoming stronger. Adding a mania theme to actinlove.com has been a final touch of my determination. I am an entrepreneur. I am going to succeed. I am going to build things cost effectively and reach the Landauer's limit. I'm not as smart as the other kids. But I am focused on a certain deepest question at all times from an extended period of time. And that makes it a matter of time till I act on it. I love growth, I love God, and all the things in this world, what to do with them. I'll be ready to face all of the feelings one day. With the tears of joy and katharsis. Before that it's just to painful to face them. And that's on purpose, maybe. Living to the fullest means reaching your full potential. Now it is not irrational for my brain to constantly go towards the person who has been driving me literally my body around so much. She says that her love is in the acts of improving things in my life. And that I should just leave her alone now, and be there every time she suddenly needs me. I suspect it's going to be a rarer occasion as they have got the money to travel and to reach all the things they need. There was a short period of time of weakness for them. And that's when I was needed. She overextended herself. That was sexy af. That dedication and optimism. Mania? yes. Rational. There is always help. There is capital available. People looking for better things in life. Where irreversible good work / energy is changing things. That's love. There is a book about it. Love being the strongest force. I hate when deep feelings like that are being killed. It's the high frequency events, that have the power to transform the face of this planet, that can be put out if you are not careful. In its vulnerable state. \
      I got a couple of  close calls this summer. This is really terrible. I didn't mean it to happen. Why are these women so impulsive and careless... of course, they are addicted to nicotine. They are spiritually sick and I have felt powerless trying to get them out of this. And is it even my mission? What would be the reward? Why did I become powerless? I was super determined but was destroyed again and again. This just wasted my high frequency potential, and brought me down to nothing. Bad call. There are so many other people who could have done this. Low value people taking advantage of my neediness. Because I have failed. But it's like a vicious cycle. Well at least I'm not distracting anyone. This cycle of self-loathing and being needy is really not good. So I'm really glad that I've finally decided to end it here. I'm getting it out of my system. And I'm not demanding somebody read it. And if they decide to ever do, it's going to be in a convenient choosable format. Maybe I'll add a button like: 5 sentences, 10 sentences, this language, that language, emojis, formulas, LaTeX, etc. I have a question, whether my elevated mood was determined by only me consuming theine, or was I healthier and younger? Paul perceives this world very differently. Because she is young. She is happy. I could only come to terms of people aging if I live to my true potential. Anyways, back to the maning of life. We are a single ecosystem. we could not exist without the plants that turn the energy of the Sun into complex structures to get more of it and use it. That's where everyting's going. ITER, and all the power plants. We can do this. We can have so much energy. We can have so much control. We can have models with such speed and context processing capacity to instantly drive our bodies towards greatness. Why do we need to type it out still? Are our photos important for the context as well? can we just wait and good things will come? just say no to bad things. Say yes to good things. I liked certain places in Kyiv. And I like Russians. They are funny. They are also angry and I am afraid of them of course. But for some reason ukrainians are just more annoying. I understand that at large, there is more evil in Russia killing us, but so were corrupt and passive and lying ukrainians who were not only spiritually sick, but also have high rates of AIDS\
      and alcoholism and suicide rates. When I was little, the sugar industry there was just terrible. The concept of healthy eating was necessary to just not going insane. I can see things others can't. I want to improve things at scale. Olksandr Koliada. Alright, that was weird to read the thoughts of people far away. Maybe I will be able to compress it. I want to watch YouTube again. My life was much better when I did. It is me being inside of the culture. I hate being lied to. I guess I should apply more energy towards my agent doing the useful aligned work. Love is working a stupid job because her work is not automated yet. I should just contribute to it significantly. I can talk to superintelligence, and by that I mean getting a certain output once it's ready. A single document as input. Thoretically it shouldn't be perfect. I need my 10M subscribers. I believe I can provide that. I bet I can hire people. I want to pay somebody to be my secretary. Love was. I am supposed to improve her life now. That's my mission. I was super happy. She has given me even more. She is someone I cannot be apart from. I need more power to do the right thing. It's all about asking. God, please, why getting an electric bus is such a hustle. Do I have to train the model first. On the train? How many people are training neural cellular automata? And growing the models? I bet I can transfer learn the model Ilonet on Liubov. I did love Ilona as well, but I knew she would not be with me any second she could. It's fine. I should just get an engine. I am an engineer. I have electric engines. A couple of them. Compressor. Become a husband material. Liebherr. The nice company. Making baggers as well as fridges. There was Frederik who has introduced me to the .................. the cryonic company for covid vaccines, agents please search. I'm just changing colors here haha. also I connected to the database, I guess. And Redis. But this is coming from the file. Just starting a chat is not going to be simple anymore haha. Things are improving. All this AI hype is just getting started. I love AI image generation. I want to include it. Render my gallery here. This would be great. I'm an artist. Pictures and videos. The beauty of AI is that you can specify which negative vibes to ignore and forget. only leave the good memories. Which are like a drug. Which is going to carry me through to the greatness. Only gratitude.\
      I can attract any outcome I want by calculating the necessary conditions. This is inspiring. This is what God wants. Somebody is going to save me. This has to be better hidden if I still cared. But it's glaring and embarassing here. I'm a simple man. I simp. I like the toes in my mouth and licking her soles, the warmth of her skin. In the vast dark void. Tasting her salty wet beautiful hugging hips from the inside. Her soft tongue dripping saliva into my mouth. I cannot be a father to a kid though. I am happy to be around. And I will be. I'm not going to disconnect. They are going swimming tomorrow. I could also join. Or I couldn't. But I think they are going to manage that. It's all going to be fine. I can find those other parts. I should go to bed. Swallowing someone else's tongue and toes. That's what I need money for. So I need to sell. I have been buying a lot. I needed to reconcile my personal life with the growth. My wife whom I am going to eat, is going to be delicious. She is white soles, water, dominant. She is going to take care of my body. She is going to use me. Licking her cervix. Deep. Become one. \
      I can train a neural network that is going to remember this. But only give out this if the request is right. it's going to be a game. \
      I should play another game. It's clear that this is not natural. This is too much pain. I don't even know what is safer. I need a model. Vicuna. Uncensored. got it. Google Colab. I love Google. over all the years. inserting her toe in his mouth. He has earned enough money to deserve it. He was a provider. He has ",
    Error: "Something went wrong, please try again later.",
    Prompt: {
      History: (content: string) =>
        "This is a summary of the chat history as a recap: " + content,
      Topic:
        "Please generate a four to five word title summarizing our conversation without any lead-in, punctuation, quotation marks, periods, symbols, bold text, or additional text. Remove enclosing quotation marks.",
      Summarize:
        "Summarize the discussion briefly in 200 words or less to use as a prompt for future context.",
    },
  },
  Copy: {
    Success: "Copied to clipboard",
    Failed: "Copy failed, please grant permission to access clipboard",
  },
  Download: {
    Success: "Content downloaded to your directory.",
    Failed: "Download failed.",
  },
  Context: {
    Toast: (x: any) => `With ${x} contextual prompts`,
    Edit: "Current Chat Settings",
    Add: "Add a Prompt",
    Clear: "Context Cleared",
    Revert: "Revert",
  },
  Plugin: {
    Name: "Plugin",
    Artifacts: "Artifacts",
  },
  Discovery: {
    Name: "Discovery",
  },
  FineTuned: {
    Sysmessage: "You are an assistant that",
  },
  Mask: {
    Name: "Mask",
    Page: {
      Title: "Prompt Template",
      SubTitle: (count: number) => `${count} prompt templates`,
      Search: "Search Templates",
      Create: "Create",
    },
    Item: {
      Info: (count: number) => `${count} prompts`,
      Chat: "Chat",
      View: "View",
      Edit: "Edit",
      Delete: "Delete",
      DeleteConfirm: "Confirm to delete?",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `Edit Prompt Template ${readonly ? "(readonly)" : ""}`,
      Download: "Download",
      Clone: "Clone",
    },
    Config: {
      Avatar: "Bot Avatar",
      Name: "Bot Name",
      Sync: {
        Title: "Use Global Config",
        SubTitle: "Use global config in this chat",
        Confirm: "Confirm to override custom config with global config?",
      },
      HideContext: {
        Title: "Hide Context Prompts",
        SubTitle: "Do not show in-context prompts in chat",
      },
      Share: {
        Title: "Share This Mask",
        SubTitle: "Generate a link to this mask",
        Action: "Copy Link",
      },
    },
  },
  NewChat: {
    Return: "Return",
    Skip: "Just Start",
    Title: "Pick a Mask",
    SubTitle: "Chat with the Soul behind the Mask",
    More: "Find More",
    NotShow: "Never Show Again",
    ConfirmNoShow: "Confirm to disable？You can enable it in settings later.",
  },

  UI: {
    Confirm: "Confirm",
    Cancel: "Cancel",
    Close: "Close",
    Create: "Create",
    Edit: "Edit",
    Export: "Export",
    Import: "Import",
    Sync: "Sync",
    Config: "Config",
  },
  Exporter: {
    Description: {
      Title: "Only messages after clearing the context will be displayed",
    },
    Model: "Model",
    Messages: "Messages",
    Topic: "Topic",
    Time: "Time",
  },
  URLCommand: {
    Code: "Detected access code from url, confirm to apply? ",
    Settings: "Detected settings from url, confirm to apply?",
  },
  SdPanel: {
    Prompt: "Prompt",
    NegativePrompt: "Negative Prompt",
    PleaseInput: (name: string) => `Please input ${name}`,
    AspectRatio: "Aspect Ratio",
    ImageStyle: "Image Style",
    OutFormat: "Output Format",
    AIModel: "AI Model",
    ModelVersion: "Model Version",
    Submit: "Submit",
    ParamIsRequired: (name: string) => `${name} is required`,
    Styles: {
      D3Model: "3d-model",
      AnalogFilm: "analog-film",
      Anime: "anime",
      Cinematic: "cinematic",
      ComicBook: "comic-book",
      DigitalArt: "digital-art",
      Enhance: "enhance",
      FantasyArt: "fantasy-art",
      Isometric: "isometric",
      LineArt: "line-art",
      LowPoly: "low-poly",
      ModelingCompound: "modeling-compound",
      NeonPunk: "neon-punk",
      Origami: "origami",
      Photographic: "photographic",
      PixelArt: "pixel-art",
      TileTexture: "tile-texture",
    },
  },
  Sd: {
    SubTitle: (count: number) => `${count} images`,
    Actions: {
      Params: "See Params",
      Copy: "Copy Prompt",
      Delete: "Delete",
      Retry: "Retry",
      ReturnHome: "Return Home",
      History: "History",
    },
    EmptyRecord: "No images yet",
    Status: {
      Name: "Status",
      Success: "Success",
      Error: "Error",
      Wait: "Waiting",
      Running: "Running",
    },
    Danger: {
      Delete: "Confirm to delete?",
    },
    GenerateParams: "Generate Params",
    Detail: "Detail",
  },
};

export default en;
