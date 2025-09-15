import type { IconType } from "react-icons";

import {
  HiArrowUpRight,
  HiOutlineLink,
  HiArrowTopRightOnSquare,
  HiEnvelope,
  HiCalendarDays,
  HiArrowRight,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineDocument,
  HiOutlineGlobeAsiaAustralia,
  HiOutlineRocketLaunch,
  HiCubeTransparent,
  HiOutlineBuildingOffice2,
  HiOutlinePaintBrush,
  HiOutlineCube,
  HiOutlineCog6Tooth,
  HiOutlineExclamationTriangle,
  HiOutlineHeart,
} from "react-icons/hi2";

import {
  HiPlay,
  HiPause,
  HiArrowPath,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiArrowDownTray,
  HiBackward,
  HiForward,
} from "react-icons/hi2";

import {
  PiHouseDuotone,
  PiUserCircleDuotone,
  PiGridFourDuotone,
  PiBookBookmarkDuotone,
  PiImageDuotone,
  PiMusicNoteDuotone,
} from "react-icons/pi";

import {
  SiJavascript,
  SiNextdotjs,
  SiFigma,
  SiSupabase,
} from "react-icons/si";

import { FaDiscord, FaGithub, FaLinkedin, FaX, FaThreads, FaXTwitter, FaFacebook, FaPinterest, FaWhatsapp, FaReddit, FaTelegram, FaVk, FaGamepad, FaChair, FaExpand, FaMoon, FaSun } from "react-icons/fa6";

export const iconLibrary: Record<string, IconType> = {
  arrowUpRight: HiArrowUpRight,
  arrowRight: HiArrowRight,
  email: HiEnvelope,
  globe: HiOutlineGlobeAsiaAustralia,
  person: PiUserCircleDuotone,
  grid: PiGridFourDuotone,
  book: PiBookBookmarkDuotone,
  openLink: HiOutlineLink,
  calendar: HiCalendarDays,
  home: PiHouseDuotone,
  gallery: PiImageDuotone,
  discord: FaDiscord,
  eye: HiOutlineEye,
  eyeOff: HiOutlineEyeSlash,
  github: FaGithub,
  linkedin: FaLinkedin,
  x: FaX,
  twitter: FaXTwitter,
  threads: FaThreads,
  arrowUpRightFromSquare: HiArrowTopRightOnSquare,
  document: HiOutlineDocument,
  rocket: HiOutlineRocketLaunch,
  "music-note": PiMusicNoteDuotone,
  "3d": HiCubeTransparent,
  javascript: SiJavascript,
  nextjs: SiNextdotjs,
  supabase: SiSupabase,
  figma: SiFigma,
  facebook: FaFacebook,
  pinterest: FaPinterest,
  whatsapp: FaWhatsapp,
  reddit: FaReddit,
  telegram: FaTelegram,
  vk: FaVk,
  play: HiPlay,
  pause: HiPause,
  repeat: HiArrowPath,
  volume: HiSpeakerWave,
  mute: HiSpeakerXMark,
  download: HiArrowDownTray,
  previous: HiBackward,
  next: HiForward,
  // 3D модели иконки
  building: HiOutlineBuildingOffice2,
  palette: HiOutlinePaintBrush,
  package: HiOutlineCube,
  gamepad: FaGamepad,
  chair: FaChair,
  gear: HiOutlineCog6Tooth,
  expand: FaExpand,
  warning: HiOutlineExclamationTriangle,
  moon: FaMoon,
  sun: FaSun,
  heart: HiOutlineHeart,
};

export type IconLibrary = typeof iconLibrary;
export type IconName = keyof IconLibrary;
