import React, { useState } from "react";
import { Box, Typography, IconButton, InputBase, Select, MenuItem } from "@mui/material";
import { ArrowRight as ArrowRightIcon, ArrowLeft as ArrowLeftIcon } from "@mui/icons-material";

function ExportIcon() {
  return (
    <svg
      width="30"
      height="30"
      style={{
        marginRight: "18px",
        marginTop: "-5.5px",
      }}
      viewBox="0 0 384 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M261.969 138.161C266.51 138.201 270.884 136.46 274.15 133.314L348.49 59.171V86.5616C348.49 91.142 350.314 95.5347 353.562 98.7735C356.809 102.012 361.214 103.832 365.806 103.832C370.399 103.832 374.803 102.012 378.051 98.7735C381.298 95.5347 383.122 91.142 383.122 86.5616V19.9571C383.255 19.1197 383.325 18.2719 383.333 17.4203C383.353 15.1272 382.915 12.8531 382.044 10.7306C381.173 8.60815 379.887 6.6799 378.262 5.05834C376.636 3.43679 374.702 2.15442 372.574 1.28606C370.446 0.417693 368.166 -0.0192746 365.867 0.000652068C365.013 0.00805177 364.163 0.0784012 363.323 0.210277H296.542C291.949 0.210277 287.545 2.02982 284.297 5.26862C281.05 8.50742 279.226 12.9002 279.226 17.4805C279.226 22.0609 281.05 26.4537 284.297 29.6925C287.545 32.9313 291.949 34.7508 296.542 34.7508H324.005L249.664 108.894C246.51 112.151 244.765 116.514 244.804 121.042C244.844 125.57 246.665 129.902 249.875 133.104C253.086 136.306 257.429 138.122 261.969 138.161Z"
        fill="var(--color-white)"
      />
      <path
        d="M261.969 138.161C266.51 138.201 270.884 136.46 274.15 133.314L348.49 59.171V86.5616C348.49 91.142 350.314 95.5347 353.562 98.7735C356.809 102.012 361.214 103.832 365.806 103.832C370.399 103.832 374.803 102.012 378.051 98.7735C381.298 95.5347 383.122 91.142 383.122 86.5616V19.9571C383.255 19.1197 383.325 18.2719 383.333 17.4203C383.353 15.1272 382.915 12.8531 382.044 10.7306C381.173 8.60815 379.887 6.6799 378.262 5.05834C376.636 3.43679 374.702 2.15442 372.574 1.28606C370.446 0.417693 368.166 -0.0192746 365.867 0.000652068C365.013 0.00805177 364.163 0.0784012 363.323 0.210277H296.542C291.949 0.210277 287.545 2.02982 284.297 5.26862C281.05 8.50742 279.226 12.9002 279.226 17.4805C279.226 22.0609 281.05 26.4537 284.297 29.6925C287.545 32.9313 291.949 34.7508 296.542 34.7508H324.005L249.664 108.894C246.51 112.151 244.765 116.514 244.804 121.042C244.844 125.57 246.665 129.902 249.875 133.104C253.086 136.306 257.429 138.122 261.969 138.161Z"
        fill="url(#paint0_linear_1881_14927)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M288.671 140.935C277.156 152.419 269.264 154.838 261.987 154.838C254.709 154.838 244.598 150.527 238.474 144.42C232.35 138.312 228.025 127.581 228.025 120.967C228.025 112.122 230.451 105.842 239.544 96.7734L278.357 58.0636H40.0257C17.949 58.0636 0 75.4225 0 96.7734V261.29C0 282.641 17.949 300 40.0257 300H280.18C302.257 300 320.206 282.641 320.206 261.29V109.483L288.671 140.935ZM202.505 132.157C199.691 128.165 195.063 125.806 190.122 125.806C185.182 125.806 180.491 128.165 177.739 132.157L123.329 209.334L106.756 189.314C103.879 185.867 99.564 183.871 95.0611 183.871C90.5582 183.871 86.1804 185.867 83.3661 189.314L43.3404 237.701C39.713 242.056 39.0251 248.044 41.5267 253.064C44.0283 258.085 49.2817 261.29 55.0354 261.29H265.171C270.737 261.29 275.865 258.326 278.429 253.548C280.993 248.77 280.681 243.024 277.554 238.609L202.505 132.157ZM70.0451 149.999C78.0067 149.999 85.6422 146.941 91.2719 141.496C96.9016 136.051 100.064 128.667 100.064 120.967C100.064 113.267 96.9016 105.883 91.2719 100.438C85.6422 94.9934 78.0067 91.9347 70.0451 91.9347C62.0834 91.9347 54.4479 94.9934 48.8182 100.438C43.1885 105.883 40.0257 113.267 40.0257 120.967C40.0257 128.667 43.1885 136.051 48.8182 141.496C54.4479 146.941 62.0834 149.999 70.0451 149.999Z"
        fill="var(--color-white)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M288.671 140.935C277.156 152.419 269.264 154.838 261.987 154.838C254.709 154.838 244.598 150.527 238.474 144.42C232.35 138.312 228.025 127.581 228.025 120.967C228.025 112.122 230.451 105.842 239.544 96.7734L278.357 58.0636H40.0257C17.949 58.0636 0 75.4225 0 96.7734V261.29C0 282.641 17.949 300 40.0257 300H280.18C302.257 300 320.206 282.641 320.206 261.29V109.483L288.671 140.935ZM202.505 132.157C199.691 128.165 195.063 125.806 190.122 125.806C185.182 125.806 180.491 128.165 177.739 132.157L123.329 209.334L106.756 189.314C103.879 185.867 99.564 183.871 95.0611 183.871C90.5582 183.871 86.1804 185.867 83.3661 189.314L43.3404 237.701C39.713 242.056 39.0251 248.044 41.5267 253.064C44.0283 258.085 49.2817 261.29 55.0354 261.29H265.171C270.737 261.29 275.865 258.326 278.429 253.548C280.993 248.77 280.681 243.024 277.554 238.609L202.505 132.157ZM70.0451 149.999C78.0067 149.999 85.6422 146.941 91.2719 141.496C96.9016 136.051 100.064 128.667 100.064 120.967C100.064 113.267 96.9016 105.883 91.2719 100.438C85.6422 94.9934 78.0067 91.9347 70.0451 91.9347C62.0834 91.9347 54.4479 94.9934 48.8182 100.438C43.1885 105.883 40.0257 113.267 40.0257 120.967C40.0257 128.667 43.1885 136.051 48.8182 141.496C54.4479 146.941 62.0834 149.999 70.0451 149.999Z"
        fill="url(#paint1_linear_1881_14927)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_1881_14927"
          x1="191.667"
          y1="0"
          x2="191.667"
          y2="300"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F9A754" />
          <stop offset="0.5" stopColor="#F26B27" />
          <stop offset="1" stopColor="#EF4E59" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_1881_14927"
          x1="191.667"
          y1="0"
          x2="191.667"
          y2="300"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F9A754" />
          <stop offset="0.5" stopColor="#F26B27" />
          <stop offset="1" stopColor="#EF4E59" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default ExportIcon;

export function TiledIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 2.31567C0 1.70148 0.243231 1.11245 0.676186 0.678157C1.10914 0.243862 1.69635 -0.00012207 2.30864 -0.00012207H4.04012C4.65241 -0.00012207 5.23963 0.243862 5.67258 0.678157C6.10553 1.11245 6.34876 1.70148 6.34876 2.31567V4.05251C6.34876 4.6667 6.10553 5.25573 5.67258 5.69002C5.23963 6.12431 4.65241 6.3683 4.04012 6.3683H2.30864C1.69635 6.3683 1.10914 6.12431 0.676186 5.69002C0.243231 5.25573 0 4.6667 0 4.05251V2.31567ZM7.50309 2.31567C7.50309 1.70148 7.74632 1.11245 8.17927 0.678157C8.61223 0.243862 9.19944 -0.00012207 9.81173 -0.00012207H11.5432C12.1555 -0.00012207 12.7427 0.243862 13.1757 0.678157C13.6086 1.11245 13.8519 1.70148 13.8519 2.31567V4.05251C13.8519 4.6667 13.6086 5.25573 13.1757 5.69002C12.7427 6.12431 12.1555 6.3683 11.5432 6.3683H9.81173C9.19944 6.3683 8.61223 6.12431 8.17927 5.69002C7.74632 5.25573 7.50309 4.6667 7.50309 4.05251V2.31567ZM0 9.84198C0 9.2278 0.243231 8.63877 0.676186 8.20447C1.10914 7.77018 1.69635 7.52619 2.30864 7.52619H4.04012C4.65241 7.52619 5.23963 7.77018 5.67258 8.20447C6.10553 8.63877 6.34876 9.2278 6.34876 9.84198V11.5788C6.34876 12.193 6.10553 12.782 5.67258 13.2163C5.23963 13.6506 4.65241 13.8946 4.04012 13.8946H2.30864C1.69635 13.8946 1.10914 13.6506 0.676186 13.2163C0.243231 12.782 0 12.193 0 11.5788V9.84198ZM7.50309 9.84198C7.50309 9.2278 7.74632 8.63877 8.17927 8.20447C8.61223 7.77018 9.19944 7.52619 9.81173 7.52619H11.5432C12.1555 7.52619 12.7427 7.77018 13.1757 8.20447C13.6086 8.63877 13.8519 9.2278 13.8519 9.84198V11.5788C13.8519 12.193 13.6086 12.782 13.1757 13.2163C12.7427 13.6506 12.1555 13.8946 11.5432 13.8946H9.81173C9.19944 13.8946 8.61223 13.6506 8.17927 13.2163C7.74632 12.782 7.50309 12.193 7.50309 11.5788V9.84198Z"
        fill="var(--color-white)"
      />
    </svg>
  );
}

export function HorizontalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0.678048 1.17805C0.243901 1.61219 0 2.20102 0 2.815V4.55125C0 5.16523 0.243901 5.75406 0.678048 6.1882C1.11219 6.62235 1.70102 6.86625 2.315 6.86625H4.05125C4.1114 6.86625 4.17132 6.86391 4.23087 6.85928H9.65913C9.71868 6.86391 9.77859 6.86625 9.83875 6.86625H11.575C12.189 6.86625 12.7778 6.62235 13.212 6.1882C13.6461 5.75406 13.89 5.16523 13.89 4.55125V2.815C13.89 2.20102 13.6461 1.61219 13.212 1.17805C12.7778 0.743901 12.189 0.5 11.575 0.5H2.315C1.70102 0.5 1.11219 0.743901 0.678048 1.17805Z"
        fill="var(--color-white)"
      />
      <path
        d="M0.678048 8.7018C0.243901 9.13594 0 9.72477 0 10.3387V12.075C0 12.689 0.243901 13.2778 0.678048 13.712C1.11219 14.1461 1.70102 14.39 2.315 14.39H11.575C12.189 14.39 12.7778 14.1461 13.212 13.712C13.6461 13.2778 13.89 12.689 13.89 12.075V10.3387C13.89 9.72477 13.6461 9.13594 13.212 8.7018C12.7778 8.26765 12.189 8.02375 11.575 8.02375H9.83875C9.77859 8.02375 9.71868 8.02609 9.65913 8.03072H4.23087C4.17132 8.02609 4.1114 8.02375 4.05125 8.02375H2.315C1.70102 8.02375 1.11219 8.26765 0.678048 8.7018Z"
        fill="var(--color-white)"
      />
    </svg>
  );
}

export function VerticalIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.77778 2.39474C3.77778 2.89725 3.57877 3.37919 3.22454 3.73452C2.8703 4.08985 2.38985 4.28947 1.88889 4.28947C1.38792 4.28947 0.907478 4.08985 0.553243 3.73452C0.199007 3.37919 0 2.89725 0 2.39474C0 1.89222 0.199007 1.41029 0.553243 1.05496C0.907478 0.699623 1.38792 0.5 1.88889 0.5C2.38985 0.5 2.8703 0.699623 3.22454 1.05496C3.57877 1.41029 3.77778 1.89222 3.77778 2.39474ZM3.77778 7.44737C3.77778 7.94988 3.57877 8.43182 3.22454 8.78715C2.8703 9.14248 2.38985 9.3421 1.88889 9.3421C1.38792 9.3421 0.907478 9.14248 0.553243 8.78715C0.199007 8.43182 0 7.94988 0 7.44737C0 6.94485 0.199007 6.46292 0.553243 6.10759C0.907478 5.75225 1.38792 5.55263 1.88889 5.55263C2.38985 5.55263 2.8703 5.75225 3.22454 6.10759C3.57877 6.46292 3.77778 6.94485 3.77778 7.44737ZM3.77778 12.5C3.77778 13.0025 3.57877 13.4844 3.22454 13.8398C2.8703 14.1951 2.38985 14.3947 1.88889 14.3947C1.38792 14.3947 0.907478 14.1951 0.553243 13.8398C0.199007 13.4844 0 13.0025 0 12.5C0 11.9975 0.199007 11.5156 0.553243 11.1602C0.907478 10.8049 1.38792 10.6053 1.88889 10.6053C2.38985 10.6053 2.8703 10.8049 3.22454 11.1602C3.57877 11.5156 3.77778 11.9975 3.77778 12.5Z"
        fill="var(--color--white)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.03516 2.39475C5.03516 2.05974 5.16783 1.73845 5.40398 1.50156C5.64014 1.26467 5.96044 1.13159 6.29442 1.13159H15.1092C15.4432 1.13159 15.7635 1.26467 15.9997 1.50156C16.2358 1.73845 16.3685 2.05974 16.3685 2.39475C16.3685 2.72976 16.2358 3.05105 15.9997 3.28794C15.7635 3.52482 15.4432 3.65791 15.1092 3.65791H6.29442C5.96044 3.65791 5.64014 3.52482 5.40398 3.28794C5.16783 3.05105 5.03516 2.72976 5.03516 2.39475ZM5.03516 7.44738C5.03516 7.11237 5.16783 6.79108 5.40398 6.55419C5.64014 6.31731 5.96044 6.18422 6.29442 6.18422H15.1092C15.4432 6.18422 15.7635 6.31731 15.9997 6.55419C16.2358 6.79108 16.3685 7.11237 16.3685 7.44738C16.3685 7.78239 16.2358 8.10368 15.9997 8.34057C15.7635 8.57746 15.4432 8.71054 15.1092 8.71054H6.29442C5.96044 8.71054 5.64014 8.57746 5.40398 8.34057C5.16783 8.10368 5.03516 7.78239 5.03516 7.44738ZM5.03516 12.5C5.03516 12.165 5.16783 11.8437 5.40398 11.6068C5.64014 11.3699 5.96044 11.2369 6.29442 11.2369H15.1092C15.4432 11.2369 15.7635 11.3699 15.9997 11.6068C16.2358 11.8437 16.3685 12.165 16.3685 12.5C16.3685 12.835 16.2358 13.1563 15.9997 13.3932C15.7635 13.6301 15.4432 13.7632 15.1092 13.7632H6.29442C5.96044 13.7632 5.64014 13.6301 5.40398 13.3932C5.16783 13.1563 5.03516 12.835 5.03516 12.5Z"
        fill="var(--color-white)"
      />
    </svg>
  );
}
export function ListIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.77778 2.39474C3.77778 2.89725 3.57877 3.37919 3.22454 3.73452C2.8703 4.08985 2.38985 4.28947 1.88889 4.28947C1.38792 4.28947 0.907478 4.08985 0.553243 3.73452C0.199007 3.37919 0 2.89725 0 2.39474C0 1.89222 0.199007 1.41029 0.553243 1.05496C0.907478 0.699623 1.38792 0.5 1.88889 0.5C2.38985 0.5 2.8703 0.699623 3.22454 1.05496C3.57877 1.41029 3.77778 1.89222 3.77778 2.39474ZM3.77778 7.44737C3.77778 7.94988 3.57877 8.43182 3.22454 8.78715C2.8703 9.14248 2.38985 9.3421 1.88889 9.3421C1.38792 9.3421 0.907478 9.14248 0.553243 8.78715C0.199007 8.43182 0 7.94988 0 7.44737C0 6.94485 0.199007 6.46292 0.553243 6.10759C0.907478 5.75225 1.38792 5.55263 1.88889 5.55263C2.38985 5.55263 2.8703 5.75225 3.22454 6.10759C3.57877 6.46292 3.77778 6.94485 3.77778 7.44737ZM3.77778 12.5C3.77778 13.0025 3.57877 13.4844 3.22454 13.8398C2.8703 14.1951 2.38985 14.3947 1.88889 14.3947C1.38792 14.3947 0.907478 14.1951 0.553243 13.8398C0.199007 13.4844 0 13.0025 0 12.5C0 11.9975 0.199007 11.5156 0.553243 11.1602C0.907478 10.8049 1.38792 10.6053 1.88889 10.6053C2.38985 10.6053 2.8703 10.8049 3.22454 11.1602C3.57877 11.5156 3.77778 11.9975 3.77778 12.5Z"
        fill="var(--color-white)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.03711 2.39475C5.03711 2.05974 5.16978 1.73845 5.40594 1.50156C5.6421 1.26467 5.96239 1.13159 6.29637 1.13159H15.1112C15.4452 1.13159 15.7655 1.26467 16.0016 1.50156C16.2378 1.73845 16.3704 2.05974 16.3704 2.39475C16.3704 2.72976 16.2378 3.05105 16.0016 3.28794C15.7655 3.52482 15.4452 3.65791 15.1112 3.65791H6.29637C5.96239 3.65791 5.6421 3.52482 5.40594 3.28794C5.16978 3.05105 5.03711 2.72976 5.03711 2.39475ZM5.03711 7.44738C5.03711 7.11237 5.16978 6.79108 5.40594 6.55419C5.6421 6.31731 5.96239 6.18422 6.29637 6.18422H15.1112C15.4452 6.18422 15.7655 6.31731 16.0016 6.55419C16.2378 6.79108 16.3704 7.11237 16.3704 7.44738C16.3704 7.78239 16.2378 8.10368 16.0016 8.34057C15.7655 8.57746 15.4452 8.71054 15.1112 8.71054H6.29637C5.96239 8.71054 5.6421 8.57746 5.40594 8.34057C5.16978 8.10368 5.03711 7.78239 5.03711 7.44738ZM5.03711 12.5C5.03711 12.165 5.16978 11.8437 5.40594 11.6068C5.6421 11.3699 5.96239 11.2369 6.29637 11.2369H15.1112C15.4452 11.2369 15.7655 11.3699 16.0016 11.6068C16.2378 11.8437 16.3704 12.165 16.3704 12.5C16.3704 12.835 16.2378 13.1563 16.0016 13.3932C15.7655 13.6301 15.4452 13.7632 15.1112 13.7632H6.29637C5.96239 13.7632 5.6421 13.6301 5.40594 13.3932C5.16978 13.1563 5.03711 12.835 5.03711 12.5Z"
        fill="var(--color-white)"
      />
    </svg>
  );
}

export function ListIconTimeline() {
  return (
    <svg width="20" height="20" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.77778 2.39474C3.77778 2.89725 3.57877 3.37919 3.22454 3.73452C2.8703 4.08985 2.38985 4.28947 1.88889 4.28947C1.38792 4.28947 0.907478 4.08985 0.553243 3.73452C0.199007 3.37919 0 2.89725 0 2.39474C0 1.89222 0.199007 1.41029 0.553243 1.05496C0.907478 0.699623 1.38792 0.5 1.88889 0.5C2.38985 0.5 2.8703 0.699623 3.22454 1.05496C3.57877 1.41029 3.77778 1.89222 3.77778 2.39474ZM3.77778 7.44737C3.77778 7.94988 3.57877 8.43182 3.22454 8.78715C2.8703 9.14248 2.38985 9.3421 1.88889 9.3421C1.38792 9.3421 0.907478 9.14248 0.553243 8.78715C0.199007 8.43182 0 7.94988 0 7.44737C0 6.94485 0.199007 6.46292 0.553243 6.10759C0.907478 5.75225 1.38792 5.55263 1.88889 5.55263C2.38985 5.55263 2.8703 5.75225 3.22454 6.10759C3.57877 6.46292 3.77778 6.94485 3.77778 7.44737ZM3.77778 12.5C3.77778 13.0025 3.57877 13.4844 3.22454 13.8398C2.8703 14.1951 2.38985 14.3947 1.88889 14.3947C1.38792 14.3947 0.907478 14.1951 0.553243 13.8398C0.199007 13.4844 0 13.0025 0 12.5C0 11.9975 0.199007 11.5156 0.553243 11.1602C0.907478 10.8049 1.38792 10.6053 1.88889 10.6053C2.38985 10.6053 2.8703 10.8049 3.22454 11.1602C3.57877 11.5156 3.77778 11.9975 3.77778 12.5Z"
        fill="var(--color-white)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.03711 2.39475C5.03711 2.05974 5.16978 1.73845 5.40594 1.50156C5.6421 1.26467 5.96239 1.13159 6.29637 1.13159H15.1112C15.4452 1.13159 15.7655 1.26467 16.0016 1.50156C16.2378 1.73845 16.3704 2.05974 16.3704 2.39475C16.3704 2.72976 16.2378 3.05105 16.0016 3.28794C15.7655 3.52482 15.4452 3.65791 15.1112 3.65791H6.29637C5.96239 3.65791 5.6421 3.52482 5.40594 3.28794C5.16978 3.05105 5.03711 2.72976 5.03711 2.39475ZM5.03711 7.44738C5.03711 7.11237 5.16978 6.79108 5.40594 6.55419C5.6421 6.31731 5.96239 6.18422 6.29637 6.18422H15.1112C15.4452 6.18422 15.7655 6.31731 16.0016 6.55419C16.2378 6.79108 16.3704 7.11237 16.3704 7.44738C16.3704 7.78239 16.2378 8.10368 16.0016 8.34057C15.7655 8.57746 15.4452 8.71054 15.1112 8.71054H6.29637C5.96239 8.71054 5.6421 8.57746 5.40594 8.34057C5.16978 8.10368 5.03711 7.78239 5.03711 7.44738ZM5.03711 12.5C5.03711 12.165 5.16978 11.8437 5.40594 11.6068C5.6421 11.3699 5.96239 11.2369 6.29637 11.2369H15.1112C15.4452 11.2369 15.7655 11.3699 16.0016 11.6068C16.2378 11.8437 16.3704 12.165 16.3704 12.5C16.3704 12.835 16.2378 13.1563 16.0016 13.3932C15.7655 13.6301 15.4452 13.7632 15.1112 13.7632H6.29637C5.96239 13.7632 5.6421 13.6301 5.40594 13.3932C5.16978 13.1563 5.03711 12.835 5.03711 12.5Z"
        fill="var(--color-white)"
      />
    </svg>
  );
}

export function Draggable() {
  return (
    <svg width="20" height="20" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.99154 15C2.42513 15 1.94043 14.8165 1.53742 14.4497C1.13442 14.0828 0.932573 13.6412 0.931887 13.125C0.9312 12.6087 1.13305 12.1675 1.53742 11.8012C1.9418 11.435 2.42651 11.2512 2.99154 11.25C3.55657 11.2487 4.04162 11.4325 4.44668 11.8012C4.85175 12.17 5.05325 12.6112 5.05119 13.125C5.04913 13.6387 4.84763 14.0803 4.44668 14.4497C4.04574 14.819 3.56069 15.0025 2.99154 15ZM9.1705 15C8.60409 15 8.11939 14.8165 7.71638 14.4497C7.31338 14.0828 7.11153 13.6412 7.11084 13.125C7.11016 12.6087 7.312 12.1675 7.71638 11.8012C8.12076 11.435 8.60546 11.2512 9.1705 11.25C9.73553 11.2487 10.2206 11.4325 10.6256 11.8012C11.0307 12.17 11.2322 12.6112 11.2301 13.125C11.2281 13.6387 11.0266 14.0803 10.6256 14.4497C10.2247 14.819 9.73965 15.0025 9.1705 15ZM2.99154 9.37499C2.42513 9.37499 1.94043 9.19155 1.53742 8.82467C1.13442 8.4578 0.932573 8.01624 0.931887 7.49999C0.9312 6.98374 1.13305 6.54249 1.53742 6.17624C1.9418 5.80999 2.42651 5.62624 2.99154 5.62499C3.55657 5.62374 4.04162 5.80749 4.44668 6.17624C4.85175 6.54499 5.05325 6.98624 5.05119 7.49999C5.04913 8.01374 4.84763 8.4553 4.44668 8.82467C4.04574 9.19405 3.56069 9.37749 2.99154 9.37499ZM9.1705 9.37499C8.60409 9.37499 8.11939 9.19155 7.71638 8.82467C7.31338 8.4578 7.11153 8.01624 7.11084 7.49999C7.11016 6.98374 7.312 6.54249 7.71638 6.17624C8.12076 5.80999 8.60546 5.62624 9.1705 5.62499C9.73553 5.62374 10.2206 5.80749 10.6256 6.17624C11.0307 6.54499 11.2322 6.98624 11.2301 7.49999C11.2281 8.01374 11.0266 8.4553 10.6256 8.82467C10.2247 9.19405 9.73965 9.37749 9.1705 9.37499ZM2.99154 3.75C2.42513 3.75 1.94043 3.56656 1.53742 3.19969C1.13442 2.83281 0.932573 2.39125 0.931887 1.875C0.9312 1.35875 1.13305 0.917504 1.53742 0.551255C1.9418 0.185006 2.42651 0.00125633 2.99154 6.33445e-06C3.55657 -0.00124366 4.04162 0.182506 4.44668 0.551255C4.85175 0.920004 5.05325 1.36125 5.05119 1.875C5.04913 2.38875 4.84763 2.83031 4.44668 3.19969C4.04574 3.56906 3.56069 3.7525 2.99154 3.75ZM9.1705 3.75C8.60409 3.75 8.11939 3.56656 7.71638 3.19969C7.31338 2.83281 7.11153 2.39125 7.11084 1.875C7.11016 1.35875 7.312 0.917504 7.71638 0.551255C8.12076 0.185006 8.60546 0.00125633 9.1705 6.33445e-06C9.73553 -0.00124366 10.2206 0.182506 10.6256 0.551255C11.0307 0.920004 11.2322 1.36125 11.2301 1.875C11.2281 2.38875 11.0266 2.83031 10.6256 3.19969C10.2247 3.56906 9.73965 3.7525 9.1705 3.75Z"
        fill="var(--color-white)"
        fill-opacity="0.2"
      />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 4.27778V11.4722C14 12.1426 13.7337 12.7856 13.2596 13.2596C12.7856 13.7337 12.1426 14 11.4722 14H2.52778C1.85737 14 1.21442 13.7337 0.740369 13.2596C0.266319 12.7856 0 12.1426 0 11.4722V4.27778H14ZM3.30556 9.33333C3.04771 9.33333 2.80042 9.43576 2.61809 9.61809C2.43576 9.80042 2.33333 10.0477 2.33333 10.3056C2.33333 10.5634 2.43576 10.8107 2.61809 10.993C2.80042 11.1753 3.04771 11.2778 3.30556 11.2778C3.56341 11.2778 3.81069 11.1753 3.99302 10.993C4.17535 10.8107 4.27778 10.5634 4.27778 10.3056C4.27778 10.0477 4.17535 9.80042 3.99302 9.61809C3.81069 9.43576 3.56341 9.33333 3.30556 9.33333ZM7 9.33333C6.74215 9.33333 6.49486 9.43576 6.31254 9.61809C6.13021 9.80042 6.02778 10.0477 6.02778 10.3056C6.02778 10.5634 6.13021 10.8107 6.31254 10.993C6.49486 11.1753 6.74215 11.2778 7 11.2778C7.25785 11.2778 7.50514 11.1753 7.68747 10.993C7.86979 10.8107 7.97222 10.5634 7.97222 10.3056C7.97222 10.0477 7.86979 9.80042 7.68747 9.61809C7.50514 9.43576 7.25785 9.33333 7 9.33333ZM3.30556 5.83333C3.04771 5.83333 2.80042 5.93576 2.61809 6.11809C2.43576 6.30042 2.33333 6.54771 2.33333 6.80556C2.33333 7.06341 2.43576 7.31069 2.61809 7.49302C2.80042 7.67535 3.04771 7.77778 3.30556 7.77778C3.56341 7.77778 3.81069 7.67535 3.99302 7.49302C4.17535 7.31069 4.27778 7.06341 4.27778 6.80556C4.27778 6.54771 4.17535 6.30042 3.99302 6.11809C3.81069 5.93576 3.56341 5.83333 3.30556 5.83333ZM7 5.83333C6.74215 5.83333 6.49486 5.93576 6.31254 6.11809C6.13021 6.30042 6.02778 6.54771 6.02778 6.80556C6.02778 7.06341 6.13021 7.31069 6.31254 7.49302C6.49486 7.67535 6.74215 7.77778 7 7.77778C7.25785 7.77778 7.50514 7.67535 7.68747 7.49302C7.86979 7.31069 7.97222 7.06341 7.97222 6.80556C7.97222 6.54771 7.86979 6.30042 7.68747 6.11809C7.50514 5.93576 7.25785 5.83333 7 5.83333ZM10.6944 5.83333C10.4366 5.83333 10.1893 5.93576 10.007 6.11809C9.82465 6.30042 9.72222 6.54771 9.72222 6.80556C9.72222 7.06341 9.82465 7.31069 10.007 7.49302C10.1893 7.67535 10.4366 7.77778 10.6944 7.77778C10.9523 7.77778 11.1996 7.67535 11.3819 7.49302C11.5642 7.31069 11.6667 7.06341 11.6667 6.80556C11.6667 6.54771 11.5642 6.30042 11.3819 6.11809C11.1996 5.93576 10.9523 5.83333 10.6944 5.83333ZM11.4722 0C12.1426 0 12.7856 0.266319 13.2596 0.740369C13.7337 1.21442 14 1.85737 14 2.52778V3.11111H0V2.52778C0 1.85737 0.266319 1.21442 0.740369 0.740369C1.21442 0.266319 1.85737 0 2.52778 0H11.4722Z"
        fill="var(--color-white)"
      />
    </svg>
  );
}

export function SingleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 4" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.77778 1.94747C3.77778 2.44999 3.57877 2.93192 3.22454 3.28725C2.8703 3.64258 2.38985 3.84221 1.88889 3.84221C1.38792 3.84221 0.907478 3.64258 0.553243 3.28725C0.199007 2.93192 0 2.44999 0 1.94747C0 1.44496 0.199007 0.963022 0.553243 0.60769C0.907478 0.252358 1.38792 0.0527344 1.88889 0.0527344C2.38985 0.0527344 2.8703 0.252358 3.22454 0.60769C3.57877 0.963022 3.77778 1.44496 3.77778 1.94747Z"
        fill="var(--color-white)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.03711 1.94748C5.03711 1.61247 5.16978 1.29119 5.40594 1.0543C5.64209 0.817409 5.96239 0.684326 6.29637 0.684326H15.1112C15.4452 0.684326 15.7655 0.817409 16.0016 1.0543C16.2378 1.29119 16.3704 1.61247 16.3704 1.94748C16.3704 2.28249 16.2378 2.60378 16.0016 2.84067C15.7655 3.07756 15.4452 3.21064 15.1112 3.21064H6.29637C5.96239 3.21064 5.64209 3.07756 5.40594 2.84067C5.16978 2.60378 5.03711 2.28249 5.03711 1.94748Z"
        fill="var(--color-white)"
      />
    </svg>
  );
}

export function SingleIconTimeline() {
  return (
    <svg width="20" height="20" viewBox="0 0 17 4" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.77778 1.94747C3.77778 2.44999 3.57877 2.93192 3.22454 3.28725C2.8703 3.64258 2.38985 3.84221 1.88889 3.84221C1.38792 3.84221 0.907478 3.64258 0.553243 3.28725C0.199007 2.93192 0 2.44999 0 1.94747C0 1.44496 0.199007 0.963022 0.553243 0.60769C0.907478 0.252358 1.38792 0.0527344 1.88889 0.0527344C2.38985 0.0527344 2.8703 0.252358 3.22454 0.60769C3.57877 0.963022 3.77778 1.44496 3.77778 1.94747Z"
        fill="var(--color-white)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.03711 1.94748C5.03711 1.61247 5.16978 1.29119 5.40594 1.0543C5.64209 0.817409 5.96239 0.684326 6.29637 0.684326H15.1112C15.4452 0.684326 15.7655 0.817409 16.0016 1.0543C16.2378 1.29119 16.3704 1.61247 16.3704 1.94748C16.3704 2.28249 16.2378 2.60378 16.0016 2.84067C15.7655 3.07756 15.4452 3.21064 15.1112 3.21064H6.29637C5.96239 3.21064 5.64209 3.07756 5.40594 2.84067C5.16978 2.60378 5.03711 2.28249 5.03711 1.94748Z"
        fill="var(--color-white)"
      />
    </svg>
  );
}

export function MapPinIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.614 33.3744L12.6133 33.3739C12.3794 33.2062 9.33636 30.9862 6.35664 27.3999C3.37075 23.806 0.500098 18.9024 0.5 13.3576C0.503837 9.94443 1.82525 6.67486 4.17024 4.26542C6.51471 1.85652 9.69044 0.504016 13 0.5C16.3096 0.504015 19.4853 1.85652 21.8298 4.26542C24.1747 6.67479 25.4961 9.94425 25.5 13.3573C25.5 18.9022 22.6293 23.806 19.6434 27.3999C16.6636 30.9862 13.6206 33.2062 13.3867 33.3739L13.386 33.3744C13.2715 33.4568 13.1368 33.5 13 33.5C12.8632 33.5 12.7285 33.4568 12.614 33.3744ZM15.9093 8.90646C15.0494 8.31609 14.0369 8.00008 13 8.00008C11.6092 8.00008 10.2782 8.56789 9.299 9.57399C8.32025 10.5796 7.77273 11.9408 7.77273 13.3573C7.77273 14.4139 8.0776 15.4478 8.65025 16.3284C9.223 17.2091 10.0385 17.8976 10.9951 18.3048C11.952 18.712 13.0057 18.8188 14.0224 18.611C15.039 18.4032 15.9709 17.8908 16.701 17.1406C17.431 16.3905 17.9266 15.4365 18.1273 14.3999C18.328 13.3633 18.2251 12.2888 17.8312 11.3116C17.4372 10.3342 16.7691 9.49672 15.9093 8.90646Z"
        fill="#973565"
        stroke="#3E3C47"
      />
      <g filter="url(#filter0_dd_3632_8092)">
        <ellipse cx="13" cy="13.7098" rx="9" ry="9.32258" fill="white" />
      </g>
      <path
        d="M14.5552 8.48389V16.4839H12.6255V10.2886H12.5786L10.7896 11.3823V9.71045L12.7622 8.48389H14.5552Z"
        fill="#3E3D47"
      />
      <defs>
        <filter
          id="filter0_dd_3632_8092"
          x="0"
          y="1.38721"
          width="26"
          height="26.6453"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology
            radius="1"
            operator="dilate"
            in="SourceAlpha"
            result="effect1_dropShadow_3632_8092"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3632_8092" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
          <feBlend
            mode="normal"
            in2="effect1_dropShadow_3632_8092"
            result="effect2_dropShadow_3632_8092"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect2_dropShadow_3632_8092"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}

export const RepeatSelector = () => {
  const [count, setCount] = useState(1);
  const [unit, setUnit] = useState("week");

  const handleIncrement = () => {
    setCount((prevCount) => prevCount + 1);
  };

  const handleDecrement = () => {
    setCount((prevCount) => (prevCount > 1 ? prevCount - 1 : 1));
  };

  const handleUnitChange = (event) => {
    setUnit(event.target.value);
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      sx={{
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <Typography variant="body1">Repeat every</Typography>
      <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
        <Box
          display="flex"
          alignItems="center"
          sx={{
            border: "1px solid gray",
            borderRadius: 1,
            backgroundColor: "var(--inputBg)",
          }}
        >
          <IconButton onClick={handleDecrement} size="small">
            <ArrowLeftIcon fontSize="small" />
          </IconButton>
          <InputBase
            value={count}
            readOnly
            sx={{
              width: "50px",
              textAlign: "center !important",
              border: "none",
              color: "var(--color-white)",
            }}
          />
          <IconButton onClick={handleIncrement} size="small">
            <ArrowRightIcon fontSize="small" />
          </IconButton>
        </Box>

        <Select
          value={unit}
          onChange={handleUnitChange}
          sx={{
            border: "1px solid gray",
            borderRadius: 1,
            width: "100px",
            color: "var(--color-white)",
          }}
        >
          <MenuItem value="day">day</MenuItem>
          <MenuItem value="week">week</MenuItem>
          <MenuItem value="month">month</MenuItem>
          <MenuItem value="year">year</MenuItem>
        </Select>
      </div>
    </Box>
  );
};
