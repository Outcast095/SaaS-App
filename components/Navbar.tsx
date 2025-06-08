'use client';

import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const Navbar = () => {
    return (
        <nav className='navbar'>
            <Link href='/'>
                <div className='flex items-center gap-2.5 cursor-pointer'>
                    <Image src={'/images/logo.svg'} alt={'logo'} width={'46'} height={'44'}></Image>
                </div>
            </Link>
            <div className='flex items-center gap-8'>
                <NavItems/>
                <SignedOut>
                    <div className='flex items-center gap-2'>
                        <SignInButton>
                            <button className='btn-signin'>Sign in</button>
                        </SignInButton>
                    </div>
                </SignedOut>
                <SignedIn>
                    <UserButton />
                </SignedIn>
            </div>
        </nav>
    );
};

export default Navbar;
