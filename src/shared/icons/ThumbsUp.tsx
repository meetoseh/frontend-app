import Svg, { SvgProps, Path } from 'react-native-svg';

const SvgComponent = (props: SvgProps) => (
  <Svg width={32} height={32} fill="#FFF" {...props}>
    <Path d="M6.489 13.353H1.284a.858.858 0 0 0-.868.867V28.1c0 .486.381.867.868.867h5.205a.859.859 0 0 0 .867-.867L7.355 14.22a.857.857 0 0 0-.866-.867ZM31.584 14.996c0-1.414-.97-2.844-2.824-2.844h-8.404c1.2-2.147 1.554-5.167.719-7.377-.613-1.625-1.785-2.574-3.3-2.67l-.025-.003a1.819 1.819 0 0 0-1.923 1.664c-.216 2.193-1.176 6.069-2.552 7.445-1.159 1.159-2.151 1.645-3.795 2.449l-.772.38c.005.06.007.119.007.18v13.737l.588.202c2.713.935 5.06 1.742 8.645 1.742h6.793c1.854 0 2.824-1.431 2.824-2.843 0-.42-.085-.84-.254-1.226a2.685 2.685 0 0 0 1.559-.862 2.91 2.91 0 0 0 .705-1.932c0-.418-.085-.84-.252-1.223 1.488-.258 2.263-1.535 2.263-2.798 0-.732-.261-1.47-.77-2.01.507-.54.768-1.278.768-2.01Z" />
  </Svg>
);

export default SvgComponent;
