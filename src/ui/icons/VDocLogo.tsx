import { SVGProps } from 'react'
const VDocLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    enableBackground="new 0 0 100 100"
    viewBox="0 0 100 100"
    {...props}
  >
    <linearGradient id="a" x1={20} x2={80} y1={50} y2={50} gradientUnits="userSpaceOnUse">
      <stop
        offset={0}
        style={{
          stopColor: '#e133ff',
        }}
      />
      <stop
        offset={1}
        style={{
          stopColor: '#00cfc6',
        }}
      />
    </linearGradient>
    <path
      d="m50 61.213 11.988-43.48H80L58.23 82.267H41.77L20 17.734h18.012L50 61.213z"
      style={{
        fill: 'url(#a)',
      }}
    />
  </svg>
)
export default VDocLogo
