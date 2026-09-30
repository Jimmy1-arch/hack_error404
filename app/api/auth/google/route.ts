import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
export async function GET(request:NextRequest){
 const clientId=process.env.GOOGLE_CLIENT_ID;
 if(!clientId||!process.env.GOOGLE_CLIENT_SECRET){return NextResponse.redirect(new URL('/signin?error=google-not-configured',request.url))}
 const state=randomBytes(24).toString('hex');const redirectUri=`${process.env.NEXT_PUBLIC_APP_URL||request.nextUrl.origin}/api/auth/google/callback`;
 const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');url.searchParams.set('client_id',clientId);url.searchParams.set('redirect_uri',redirectUri);url.searchParams.set('response_type','code');url.searchParams.set('scope','openid email profile');url.searchParams.set('state',state);url.searchParams.set('prompt','select_account');
 const response=NextResponse.redirect(url);response.cookies.set('google_oauth_state',state,{httpOnly:true,sameSite:'lax',secure:request.nextUrl.protocol==='https:',path:'/api/auth/google/callback',maxAge:600});return response;
}
