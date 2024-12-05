import "../../css/bottomBar.css";
import Button from "@mui/joy/Button";
import { useNavigate, useLocation } from "react-router-dom";
import { CssVarsProvider } from "@mui/joy/styles";

function BottomBar({ isDesign = true, designId, changeMode, showBudget = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const handleDesignClick = () => {
    navigate(`/design/${designId}`, {
      state: {
        ...location.state,
        changeMode: changeMode,
      },
    });
  };
  const handleBudgetClick = () => {
    navigate(`/budget/${designId}`, {
      state: {
        ...location.state,
        changeMode: changeMode,
      },
    });
  };

  return (
    <CssVarsProvider>
      <div className="bottomBar">
        <Button size="md" color="#302f37" sx={bottomBarButtonStyles} onClick={handleDesignClick}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 1187 1126"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ marginBottom: "5px" }}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M679.693 277.476H136.808C61.3498 277.476 0 338.702 0 414.009V988.768C0 1064.07 61.3498 1125.3 136.808 1125.3H957.656C1033.11 1125.3 1094.46 1064.07 1094.46 988.768V415.63C1083.7 433.137 1076.07 456.142 1071.34 470.603V471.288C1032.8 578.068 901.775 570.361 863.24 471.288C863.056 470.71 862.873 470.13 862.689 469.551C855.168 445.85 847.422 421.44 816.996 392.611C785.825 363.078 763.041 354.551 739.919 346.844C705.676 335.429 685.363 307.262 679.693 277.476ZM649.838 510.903C666.725 510.903 682.544 519.223 692.163 533.303L948.678 908.768C959.366 924.341 960.435 944.608 951.671 961.461C942.906 978.314 925.378 988.768 906.353 988.768H188.111C168.445 988.768 150.489 977.461 141.938 959.754C133.388 942.048 135.739 920.928 148.137 905.568L284.945 734.902C294.565 722.742 309.528 715.702 324.919 715.702C340.31 715.702 355.06 722.742 364.893 734.902L421.54 805.515L607.513 533.303C616.919 519.223 632.951 510.903 649.838 510.903ZM311.967 573.401C292.725 592.604 266.627 603.393 239.414 603.393C212.201 603.393 186.103 592.604 166.861 573.401C147.618 554.197 136.808 528.151 136.808 500.993C136.808 473.835 147.618 447.79 166.861 428.586C186.103 409.382 212.201 398.594 239.414 398.594C266.627 398.594 292.725 409.382 311.967 428.586C331.21 447.79 342.02 473.835 342.02 500.993C342.02 528.151 331.21 554.197 311.967 573.401Z"
                fill={isDesign ? "url(#paint0_linear_1671_14924)" : "var(--color-white)"}
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M909.66 88.3497C922.109 32.4647 1003.38 32.1223 1016.46 87.8703L1017.02 90.4728L1018.21 95.4038C1025.13 124.314 1040.59 150.592 1062.65 170.966C1084.71 191.339 1112.41 204.907 1142.29 209.982C1201.88 220.186 1201.88 303.945 1142.29 314.081C1112.24 319.191 1084.4 332.886 1062.27 353.442C1040.15 373.999 1024.72 400.501 1017.93 429.618L1016.46 436.192C1003.45 492.009 922.109 491.666 909.66 435.713L908.331 430.097C901.798 400.899 886.535 374.266 864.488 353.592C842.441 332.919 814.607 319.14 784.533 314.012C725.083 303.876 725.083 220.186 784.533 210.119C814.52 205.017 842.286 191.313 864.312 170.745C886.339 150.177 901.634 123.67 908.261 94.5819L909.17 90.4728L909.66 88.3497Z"
                fill={isDesign ? "url(#paint0_linear_1671_14924)" : "var(--color-white)"}
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M586.889 22.555C593.758 -7.38339 638.598 -7.56683 645.814 22.2981L646.123 23.6923L646.779 26.3339C650.599 41.8217 659.125 55.8992 671.298 66.8134C683.47 77.7277 698.75 84.9965 715.236 87.7149C748.113 93.1816 748.113 138.052 715.236 143.482C698.656 146.22 683.297 153.556 671.09 164.569C658.882 175.581 650.371 189.779 646.625 205.377L645.814 208.899C638.637 238.801 593.758 238.617 586.889 208.642L586.156 205.634C582.552 189.992 574.131 175.724 561.967 164.649C549.803 153.574 534.447 146.193 517.854 143.446C485.054 138.016 485.054 93.1816 517.854 87.7883C534.399 85.0551 549.718 77.7141 561.87 66.6955C574.023 55.6769 582.462 41.4765 586.118 25.8937L586.619 23.6923L586.889 22.555Z"
                fill={isDesign ? "url(#paint0_linear_1671_14924)" : "var(--color-white)"}
              />
              <defs>
                <linearGradient
                  id="paint0_linear_1671_14924"
                  x1="547.232"
                  y1="277.476"
                  x2="547.232"
                  y2="1125.3"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#F9A754" />
                  <stop offset="0.5" stopColor="#F26B27" />
                  <stop offset="1" stopColor="#EF4E59" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_1671_14924"
                  x1="963.463"
                  y1="46.2471"
                  x2="963.463"
                  y2="477.867"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#F9A754" />
                  <stop offset="0.5" stopColor="#F26B27" />
                  <stop offset="1" stopColor="#EF4E59" />
                </linearGradient>
                <linearGradient
                  id="paint2_linear_1671_14924"
                  x1="616.574"
                  y1="0"
                  x2="616.574"
                  y2="231.225"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#F9A754" />
                  <stop offset="0.5" stopColor="#F26B27" />
                  <stop offset="1" stopColor="#EF4E59" />
                </linearGradient>
              </defs>
            </svg>
            <span style={{ color: isDesign ? "#ff8344" : "var(--color-white)" }}>Design</span>
          </div>
        </Button>

        {showBudget && (
          <Button size="md" color="#302f37" sx={bottomBarButtonStyles} onClick={handleBudgetClick}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 1081 1047"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginBottom: "6px" }}
              >
                <path
                  d="M1066.26 716.721C1090.83 750.108 1083.7 797 1050.31 821.571L812.849 996.572C768.957 1028.83 716.063 1046.28 661.48 1046.28H60.5067C27.3068 1046.28 0.484375 1019.46 0.484375 986.256V866.212C0.484375 833.013 27.3068 806.191 60.5067 806.191H129.532L213.751 738.666C256.329 704.529 309.224 686.147 363.807 686.147H660.73C693.929 686.147 720.752 712.97 720.752 746.169C720.752 779.369 693.929 806.191 660.73 806.191H510.674C494.168 806.191 480.663 819.696 480.663 836.202C480.663 852.708 494.168 866.212 510.674 866.212H736.883L961.404 700.778C994.791 676.206 1041.68 683.334 1066.26 716.721Z"
                  fill={!isDesign ? "url(#paint0_linear_1671_14924)" : "var(--color-white)"}
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M531.432 618.33C702.128 618.33 840.504 479.953 840.504 309.257C840.504 138.561 702.128 0.18457 531.432 0.18457C360.736 0.18457 222.359 138.561 222.359 309.257C222.359 479.953 360.736 618.33 531.432 618.33ZM584.268 133.929V114.101H583.894C583.894 88.9862 563.872 68.7807 538.986 68.7807C514.099 68.7807 494.078 88.9862 494.078 114.101V135.062C481.167 138.461 468.256 143.371 456.28 150.547C428.587 167.165 404.262 196.812 404.449 240.055C404.636 281.788 428.961 308.036 454.222 323.332C475.553 336.362 502.124 344.482 522.332 350.525L525.888 351.658C549.839 359.022 565.931 364.31 576.596 371.108C584.081 375.829 584.081 377.906 584.081 379.794V380.172C584.268 384.515 583.332 386.781 582.584 387.914C581.836 389.236 580.152 391.124 576.596 393.391C568.924 398.111 555.639 401.699 540.67 401.133C521.023 400.377 502.685 394.146 477.237 385.459C475.018 384.68 472.749 383.901 470.405 383.097C468.203 382.341 465.934 381.562 463.578 380.738C440.001 372.807 414.553 385.648 406.694 409.442C398.836 433.235 411.559 458.917 435.136 466.848C437.487 467.597 439.92 468.429 442.435 469.289C443.723 469.729 445.032 470.177 446.363 470.625C447.172 470.9 447.99 471.18 448.815 471.461C462.117 476.003 477.528 481.264 494.265 485.354V506.881C494.265 531.996 514.286 552.202 539.173 552.202C564.059 552.202 584.081 531.996 584.081 506.881V486.865C597.928 483.465 611.4 477.989 623.937 470.247C652.566 452.119 674.458 421.149 673.897 378.661C673.335 337.117 650.133 310.114 624.498 293.874C602.044 279.711 574.351 271.213 553.581 264.982L551.897 264.415C527.572 257.051 511.48 251.952 500.627 245.343C496.711 243.038 495.214 241.307 494.647 240.651C494.563 240.555 494.5 240.481 494.452 240.433V239.3C494.452 236.279 495.201 234.957 495.762 234.013C496.51 232.88 498.382 230.802 502.311 228.348C511.106 223.249 524.952 219.85 538.612 220.039C555.639 220.228 574.725 224.004 595.121 229.481C619.072 235.901 643.771 221.549 650.133 197.378C656.495 173.207 642.274 148.281 618.323 141.86C607.845 139.028 596.244 136.195 584.268 133.929Z"
                  fill={!isDesign ? "url(#paint0_linear_1671_14924)" : "var(--color-white)"}
                />
              </svg>
              <span style={{ color: !isDesign ? "#ff8344" : "var(--color-white)" }}>Budget</span>
            </div>
          </Button>
        )}
      </div>
    </CssVarsProvider>
  );
}

export default BottomBar;

const bottomBarButtonStyles = {
  color: "var(--color-white)",
  borderRadius: "10px",
  // width: "78px",
  ":hover": {
    backgroundColor: "var(--iconBg)",
  },
};
