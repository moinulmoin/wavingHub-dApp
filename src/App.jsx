import {
	Alert,
	AlertIcon,
	Box,
	Button,
	Container,
	Heading,
	Input,
	InputGroup,
	InputRightElement,
	Link,
	Table,
	TableCaption,
	TableContainer,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
	VStack,
	useToast,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import ABI from './utils/WavePortal.json';

const getEthereumObject = () => window.ethereum;

const contractAddress = '0x15f159d6B5A2DD65c7f8d6469B1De4BC223339b1';
const contractABI = ABI.abi;

const findMetaMaskAccount = async () => {
	try {
		const ethereum = getEthereumObject();

		if (!ethereum) {
			console.error('Make sure you have Metamask!');
			return null;
		}

		const accounts = await ethereum.request({ method: 'eth_accounts' });

		if (accounts.length !== 0) {
			const account = accounts[0];
			return account;
		} else {
			console.error('No authorized account found');
			return null;
		}
	} catch (error) {
		console.error(error);
		return null;
	}
};

const getContract = async () => {
	try {
		const { ethereum } = window;
		if (ethereum) {
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
			return wavePortalContract;
		} else {
			throw new Error("Ethereum object doesn't exist!");
		}
	} catch (error) {
		console.error(error);
		return null;
	}
};

function App() {
	const toast = useToast();
	const [currentAccount, setCurrentAccount] = useState('');
	const [loading, setLoading] = useState(false);
	const [totalWaveCount, setTotalWaveCount] = useState(0);
	const [allWaves, setAllWaves] = useState([]);
	const [network, setNetwork] = useState('');
	const [message, setMessage] = useState('');

	useEffect(() => {
		async function run() {
			const account = await findMetaMaskAccount();
			if (account !== null) {
				setCurrentAccount(account);
			}
		}
		run();
	}, []);

	useEffect(() => {
		getNetwork();
		totalWaveCountHandler();
		waversListHandler();
	}, []);

	useEffect(() => {
		let wavePortalContract;

		const onNewWave = (from, timestamp, message) => {
			console.log('NewWave', from, timestamp, message);
			setAllWaves((prevState) => [
				...prevState,
				{
					address: from,
					timestamp: new Date(timestamp * 1000),
					message: message,
				},
			]);
			totalWaveCountHandler();
		};

		if (window.ethereum) {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();

			wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
			wavePortalContract.on('NewWave', onNewWave);
		}

		return () => {
			if (wavePortalContract) {
				wavePortalContract.off('NewWave', onNewWave);
			}
		};
	}, []);

	const getNetwork = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const network = await provider.getNetwork();
				switch (network.chainId) {
					case 1:
						return setNetwork('ETH Mainnet');
					case 5:
						return setNetwork('Goerli Testnet');
					default:
						setNetwork('');
						toast({ title: 'Unknown Network', status: 'error', position: 'top-right' });
						throw Error('Unknown Network');
				}
			} else {
				toast({ title: "Ethereum object doesn't exist!", status: 'error', position: 'top-right' });
				throw new Error("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.error(error);
		}
	};

	const connectWallet = async () => {
		try {
			setLoading(true);
			const ethereum = getEthereumObject();
			if (!ethereum) {
				toast({
					title: 'MetaMask need to connect wallet, Get MetaMask First!',
					status: 'error',
					position: 'top-right',
				});
				throw new Error('MetaMask need to connect wallet, Get MetaMask First!');
			}

			const accounts = await ethereum.request({
				method: 'eth_requestAccounts',
			});

			setCurrentAccount(accounts[0]);
			setLoading(false);
		} catch (error) {
			console.error(error);
			setLoading(false);
		}
	};

	const totalWaveCountHandler = async () => {
		try {
			const wavePortalContract = await getContract();
			if (wavePortalContract !== null) {
				const count = await wavePortalContract.getTotalWaves();
				setTotalWaveCount(count.toNumber());
			} else {
				toast({ title: 'Contract not found!', status: 'error', position: 'top-right' });
				throw new Error('Contract not found!');
			}
		} catch (error) {
			console.error(error);
		}
	};

	const waversListHandler = async () => {
		try {
			const wavePortalContract = await getContract();
			if (wavePortalContract !== null) {
				const waves = await wavePortalContract.getAllWaves();

				let wavesCleaned = [];
				waves.forEach((wave) => {
					wavesCleaned.push({
						address: wave.waver,
						timestamp: new Date(wave.timestamp * 1000),
						message: wave.message,
					});
				});
				setAllWaves(wavesCleaned);
			} else {
				toast({ title: 'Contract not found!', status: 'error', position: 'top-right' });
				throw new Error('Contract not found!');
			}
		} catch (error) {
			console.error(error);
		}
	};

	const waveHandler = async () => {
		try {
			setLoading(true);
			const wavePortalContract = await getContract();

			if (wavePortalContract !== null) {
				const waveTxn = await wavePortalContract.wave(message);
				await waveTxn.wait();
				setMessage('');
				setLoading(false);
			} else {
				throw new Error('Contract not found!');
			}
		} catch (error) {
			setLoading(false);
			console.error(error);
			if (error.message.includes('You must wait')) {
				toast({
					title: 'Please wait 60 seconds after waving once!',
					status: 'error',
					position: 'top-right',
				});
			}
		}
	};

	return (
		<Box as='main' minH='100vh' height='full' backgroundColor='gray.900' textColor='gray.100'>
			{!network.includes('Goerli') && (
				<Alert status='warning' textColor='gray.900' justifyContent='center'>
					<AlertIcon />
					Be careful, only login with goerli testnet. This is a testnet project. Thank you.
				</Alert>
			)}
			<Container maxWidth='container.xl'>
				<VStack padding={{ lg: '10' }} spacing={{ base: '12', lg: '8' }}>
					<Heading as='h1' size='4xl' paddingY='8'>
						👋 Hey
					</Heading>
					<Text fontSize={{ base: 'xl', lg: '2xl' }} textAlign='justify'>
						This is Moinul. I am a Frontend Focused Full Stack Guy. Trying to master web3. This is
						my first complete dApp based on my own smart contract made with Solidity. Connect your
						wallet and Wave me 🙌
					</Text>

					{!currentAccount ? (
						<Button
							colorScheme='blue'
							size='lg'
							disabled={currentAccount}
							onClick={connectWallet}
							isLoading={loading}
						>
							Connect your metamask wallet
						</Button>
					) : (
						<Box maxW='full'>
							<Box
								width='max-content'
								marginBottom='4'
								marginX='auto'
								fontSize={{ base: 'lg', lg: 'xl' }}
							>
								Network:{' '}
								<Box as='span' color='blue.400'>
									{network}
								</Box>
							</Box>
							<Text fontSize={{ base: 'xl', lg: '2xl' }}>
								Connected:{' '}
								<Text as='span' color='blue.400'>
									{currentAccount}
								</Text>
							</Text>
							<Text fontSize={{ base: 'xl', lg: '2xl' }}>
								Total Waves:{' '}
								<Text as='span' color='blue.400'>
									{totalWaveCount}
								</Text>
							</Text>
							<TableContainer>
								<Table variant='simple'>
									<TableCaption
										placement='top'
										fontSize='xl'
										textColor='blue.500'
										textAlign={{
											base: 'left',
											lg: 'center',
										}}
										paddingX='2'
									>
										Wavers List
									</TableCaption>
									<Thead>
										<Tr>
											<Th textColor='blue.500' textAlign='center' paddingX='2'>
												Address
											</Th>
											<Th textColor='blue.500' textAlign='center' paddingX='2'>
												Time
											</Th>
											<Th textColor='blue.500' paddingX='2' textAlign='center'>
												Message
											</Th>
										</Tr>
									</Thead>
									<Tbody>
										{allWaves.length > 0 ? (
											allWaves.map((wave, index) => (
												<Tr key={index}>
													<Td paddingX='2' textAlign='center'>
														{wave.address}
													</Td>
													<Td paddingX='2' textAlign='center'>
														{wave.timestamp.toString()}
													</Td>
													<Td paddingX='2' textAlign='center'>
														{wave.message}
													</Td>
												</Tr>
											))
										) : (
											<Tr>
												<Td paddingX='2' colSpan={3} textAlign='center'>
													No Waves found!
												</Td>
											</Tr>
										)}
									</Tbody>
								</Table>
							</TableContainer>
						</Box>
					)}

					{currentAccount ? (
						<Box>
							<InputGroup size='lg'>
								<Input
									pr='8rem'
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									placeholder='Write your message here...'
								/>
								<InputRightElement width='6rem'>
									<Button
										disabled={!message}
										type='submit'
										h='3rem'
										borderLeftRadius='0'
										colorScheme='blue'
										onClick={waveHandler}
										isLoading={loading}
									>
										👋 Wave
									</Button>
								</InputRightElement>
							</InputGroup>
						</Box>
					) : null}
				</VStack>
				<Box as='footer' textAlign='center' paddingY='8'>
					<Text>
						Made with 💙 by{' '}
						<Link href='https://moinulmoin.com' color='blue.500' isExternal>
							Moinul Moin
						</Link>
					</Text>
				</Box>
			</Container>
		</Box>
	);
}

export default App;
