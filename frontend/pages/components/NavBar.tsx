'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import React from 'react'
import { PiCirclesThreeThin } from "react-icons/pi";

// PiCirclesThreeThin

function NavBar() {
    return (
        <div className="w-full bg-blue-600 h-[70px] flex justify-between p-4">
            <div className="flex items-center">
                <PiCirclesThreeThin color="white" size="30px" />
                <Link href="/">
                    <p className="text-white font-bold text-xl ml-2">Unity Lending Circle</p>
                </Link>
            </div>
            <div className='items-center'>
                <ConnectButton />
            </div>
        </div >
    )
}

export default NavBar