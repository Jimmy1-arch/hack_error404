import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
export async function GET(request:NextRequest){
 const base=process.env.NEXT_PUBLIC_APP_URL||request.nextUrl.origin;const jar=request.cookies;const state=jar.get('google_oauth_state')?.value;const received=request.nextUrl.searchParams.get('state');const code=request.nextUrl.searchParams.get('code');
 if(!state||!received||!code||state.length!==received.length||!timingSafeEqual(Buffer.from(state),Buffer.from(received)))return NextResponse.redirect(new URL('/signin?error=google-state',base));
 const clientId=process.env.GOOGLE_CLIENT_ID;const clientSecret=process.env.GOOGLE_CLIENT_SECRET;if(!clientId||!clientSecret)return NextResponse.redirect(new URL('/signin?error=google-not-configured',base));
 const redirectUri=`${base}/api/auth/google/callback`;
 try{
  const tokens=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:redirectUri,grant_type:'authorization_code'})});if(!tokens.ok)throw new Error('token exchange failed');const tokenBody=await tokens.json();
  const profileResponse=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{authorization:`Bearer ${tokenBody.access_token}`}});if(!profileResponse.ok)throw new Error('profile lookup failed');const profile=await profileResponse.json();if(!profile.email||profile.email_verified!==true)throw new Error('verified email required');
  const payload=Buffer.from(JSON.stringify({sub:profile.sub,email:profile.email,name:profile.name,iat:Date.now()})).toString('base64url');const signature=createHmac('sha256',clientSecret).update(payload).digest('base64url');const response=NextResponse.redirect(new URL('/solve?welcome=google',base));response.cookies.set('google_oauth_state','',{httpOnly:true,path:'/api/auth/google/callback',maxAge:0});response.cookies.set('devops_session',`${payload}.${signature}`,{httpOnly:true,sameSite:'lax',secure:base.startsWith('https://'),path:'/',maxAge:60*60*24*7});return response;
 }catch{return NextResponse.redirect(new URL('/signin?error=google-failed',base))}
}
