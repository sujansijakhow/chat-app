
import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '../subaseClient'
import { useCallback } from 'react';

function App() {

  const [session, setSession] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userOnline, setUserOnline] = useState([]);

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

  useEffect


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
              <p className='text-gray-300'>Signed in as {session ?.user?.user_metadata?.full_name}</p>
              <p className='text-gray-300 italic text-sm'>3 users online</p>
            </div>
            <button onClick={signOut} className='m-2 sm:mr-4'>Sign out</button>
          </div>
          {/* main chat */}
          <div className='flex flex-col overflow-y-auto h-[500px]'>

          </div>
          {/* message input */}
          <form className='flex flex-col sm:flex-row gap-4 p-4 border-t-[1px] border-gray-700'>
            <input type="text" placeholder='Type a message...'
              value={newMessage}
              onChange={(e) => setMessages(e.target.value)}
              className='p-2 w-full bg-[#00000040] rounded-lg' />
            <button className='mt-4 sm:mt-0 sm:ml-0 text-gray-400 max-h-12'>Send</button>
          </form>
        </div>
      </div>
    )
  }


}

export default App
