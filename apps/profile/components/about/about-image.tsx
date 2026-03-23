import Image from "next/image";

interface AboutImageProps {
  mobile: string;
  desktop: string;
}

export function AboutImage({ mobile, desktop }: AboutImageProps) {
  return (
    <>
      <Image
        src={mobile}
        alt="Harsh Sandhu"
        fill
        priority
        className="object-cover object-center md:hidden"
        sizes="100vw"
      />
      <Image
        src={desktop}
        alt="Harsh Sandhu"
        fill
        priority
        className="object-cover object-center hidden md:block"
        sizes="(min-width: 768px) 100vw"
      />
    </>
  );
}

AboutImage.displayName = "AboutImage";
