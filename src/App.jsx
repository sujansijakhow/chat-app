
import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../subaseClient'
import { useCallback } from 'react';

function App() {

  const [session, setSession] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userOnline, setUserOnline] = useState([]);
  
  const chatContainerRef = useRef(null);
  const scroll = useRef()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription?.unsubscribe()
  }, [])

  console.log(session)

  //  Sign IN
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google"
    });
  };

  console.log(session)

  // Sign Out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    } else {
      setSession(null); // Ensure session is updated to trigger re-render
    }


  };

  useEffect(() => {
    if (!session?.user) {
      setUserOnline([]);
      return;

    }
    const roomOne = supabase.channel("room_one", {
      config: {
        presence: {
          key: session?.user?.id,
        }
      }
    });

    roomOne.on("broadcast", { event: "message" }, (payload) => {
      setMessages((prevMessages) => [...prevMessages, payload.payload]);
      console.log(messages);
    });

    // track user presence subscribe! 
    roomOne.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await roomOne.track({
          id: session?.user?.id,
        });
      }
    });

    // handle user presence
    roomOne.on("presence", { event: "sync" }, () => {
      const state = roomOne.presenceState();
      setUserOnline(Object.keys(state));
    });

    return () => {
      roomOne.unsubscribe();
    }

  }, [session]);

  // send message

  const sendMessage = async (e) => {
    e.preventDefault();

    supabase.channel("room_one").send({
      type: "broadcast",
      event: "message",
      payload: {
        message: newMessage,
        user_name: session?.user?.user_metadata?.full_name,
        avatar: session?.user?.user_metadata?.avatar_url,
        timestamp: new Date().toISOString(),
      },
    });
    setNewMessage("");
  }

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // Set to false for 24-hour format
    });
  };

  useEffect(() => {
    setTimeout(() => {
      if(chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, [100])
  }, [messages])
  


  if (!session) {
    return (
      <div className='w-full h-screen flex justify-center items-center'>
        <button onClick={signIn}> Sign in with google to chat</button>
      </div>
    );
  } else {
    return (
      <div className='w-full h-screen flex justify-center items-center p-4'>
        <div className='border-[1px] border-gray-700 max-w-6xl w-full min-h-[600px] rounded-lg'>
          {/* header */}
          <div className='flex justify-between h-20 border-b-[1px] border-gray-700'>
            <div className='p-4'>
              <p className='text-gray-300'>Signed in as {session?.user?.user_metadata?.email}</p>
              <p className='text-gray-300 italic text-sm'>{userOnline.length} users online</p>
            </div>
            <button onClick={signOut} className='m-2 sm:mr-4'>Sign out</button>
          </div>
          {/* main chat */}
          <div ref={chatContainerRef} className='flex flex-col overflow-y-auto h-[500px] p-4'>
            {messages?.map((msg, inx) => (
              <div className={`my-2 flex w-full items-start ${msg?.user_name === session?.user?.user_metadata?.full_name ? "justify-end" : "justify-start"} `}> 

                {/* received msg avatar on left*/}
                {msg?.user_name !== session?.user?.user_metadata?.full_name && (
                  <img src={msg.avatar} alt="/" className='w-10 h-10 rounded-full mr-2' />
                )}

                <div className='flex flex-col gap-0.5 justify-center w-full '>
                  <div className={`p-1 max-w-[70%] rounded-xl ${msg?.user_name === session?.user?.user_metadata.full_name ? "bg-gray-600 text-white ml-auto" : "bg-gray-500 text-white mr-auto"}`}>
                    <p>{msg.message}</p>
                  </div>
                  {/* timestamps */}
                  <div className={`text-xs opacity-75 pt-1 ${msg?.user_name == session?.user?.user_metadata?.full_name ? "text-right mr-2" : "text-left ml-2"}`}>{formatTime(msg?.timestamp)}</div>
                </div>
                
                {msg?.user_name == session?.user?.user_metadata.full_name && (
                  <img src={msg.avatar} alt="/" className='w-10 h-10 rounded-full ml-2' />

                )}

              </div>
            ))}
          </div>
          {/* message input */}
          <form
            onSubmit={sendMessage}
            className='flex flex-col sm:flex-row gap-4 p-4 border-t-[1px] border-gray-700'>
            <input type="text" placeholder='Type a message...'
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className='p-2 w-full bg-[#00000040] rounded-lg' />
            <button className='mt-4 sm:mt-0 sm:ml-0 text-gray-400 max-h-12'>Send</button>
            <span ref={scroll}></span>
          </form>
        </div>
      </div>
    )
  }


}

export default App
