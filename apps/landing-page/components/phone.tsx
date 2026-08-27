import Image, { StaticImageData } from "next/image";

import Splash from "@/assets/splash.jpg";

interface Props {
  image?: StaticImageData;
}

export const Phone = ({ image }: Props) => {
  return (
    <div
      className={`relative bg-zinc-800 rounded-3xl p-2.5 aspect-[9/16] w-2/3 -mb-28 min-[530px]:w-1/2 sm:w-72 lg:min-w-[300px] lg:mb-[-400px]`}
    >
      <div className="bg-zinc-800 absolute top-12 -left-0.5 w-0.5 h-4 translate-y-2" />
      <div className="bg-zinc-800 absolute top-20 -left-0.5 w-0.5 h-6 translate-y-2" />
      <div className="bg-zinc-800 absolute top-28 -left-0.5 w-0.5 h-6 translate-y-2" />
      <div className="bg-zinc-800 absolute top-24 -right-0.5 w-0.5 h-10" />
      <div className="bg-neutral-200 w-full h-full rounded-2xl overflow-hidden relative">
        <div className="absolute left-1/2 -translate-x-1/2 z-20 top-0 bg-zinc-800 w-1/3 h-[5%] rounded-b-2xl flex items-center justify-center px-3 lg:px-5 gap-2">
          <div className="absolute z-[-1] h-3 aspect-square bg-zinc-800 top-0 -left-3">
            <div className="h-full aspect-square bg-primary rounded-tr-full" />
          </div>
          <div className="absolute z-[-1] h-3 aspect-square bg-zinc-800 top-0 -right-3">
            <div className="h-full aspect-square bg-primary rounded-tl-full" />
          </div>
          <div className="-mt-1 bg-neutral-200 rounded-full h-1 flex-1" />
          <div className="-mt-1 bg-neutral-200 rounded-full h-1 w-1" />
        </div>
        <Image
          priority
          alt="Phone image"
          className="w-full h-full object-cover"
          src={Splash}
        />
      </div>
    </div>
  );
};
