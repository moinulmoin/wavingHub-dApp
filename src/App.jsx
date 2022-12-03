import {
	VStack,
	Container,
	Heading,
	Box,
	Text,
	Button,
	TableContainer,
	Table,
	TableCaption,
	Thead,
	Tbody,
	Tr,
	Th,
	Td,
	Tfoot,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import ABI from './utils/WavePortal.json';

const getEthereumObject = () => window.ethereum;

const contractAddress = '0x7F62224f20bdD8ec9e89b8f1e6197E049fa62F30';
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
			const wavePortalContract = new ethers.Contract(
				contractAddress,
				contractABI,
				signer
			);
			return wavePortalContract;
		} else {
			return null;
			throw new Error("Ethereum object doesn't exist!");
		}
	} catch (error) {
		return null;
		console.error(error);
	}
};

function App() {
	const [currentAccount, setCurrentAccount] = useState('');
	const [loading, setLoading] = useState(false);
	const [totalWaveCount, setTotalWaveCount] = useState(0);
	const [allWaves, setAllWaves] = useState([]);

	useEffect(() => {
		async function run() {
			const account = await findMetaMaskAccount();
			if (account !== null) {
				setCurrentAccount(account);
			}
		}
		run();
	}, []);

	const connectWallet = async () => {
		try {
			setLoading(true);
			const ethereum = getEthereumObject();
			if (!ethereum) {
				alert('Get MetaMask!');
				throw new Error('MetaMask need to connect wallet!');
			}

			const accounts = await ethereum.request({
				method: 'eth_requestAccounts',
			});

			setCurrentAccount(accounts[0]);
			setLoading(false);
			totalWaveCountHandler();
			waversListHandler();
		} catch (error) {
			console.error(error);
			setLoading(false);
		}
	};

	const totalWaveCountHandler = async () => {
		try {
			const wavePortalContract = await getContract();
			const count = await wavePortalContract.getTotalWaves();
			setTotalWaveCount(count.toNumber());
		} catch (error) {
			console.error(error);
		}
	};

	const waversListHandler = async () => {
		try {
			const wavePortalContract = await getContract();
			const wavers = await wavePortalContract.getAllWavers();
			setAllWaves(wavers);
		} catch (error) {
			console.error(error);
		}
	};

	const waveHandler = async () => {
		try {
			setLoading(true);
			const wavePortalContract = await getContract();

			if (wavePortalContract !== null) {
				const waveTxn = await wavePortalContract.wave();
				await waveTxn.wait();
				await totalWaveCountHandler();
				await waversListHandler();
				setLoading(false);
			}
		} catch (error) {
			setLoading(false);
			console.error(error);
		}
	};

	return (
		<Box
			as='main'
			minH='100vh'
			backgroundColor='gray.900'
			textColor='gray.100'
		>
			<Container maxWidth='container.xl'>
				<VStack
					padding={{ base: 4, lg: '10' }}
					spacing={{ base: '14', lg: '10' }}
				>
					<Heading as='h1' size='4xl'>
						👋 Hey
					</Heading>
					<Text
						fontSize={{ base: 'xl', lg: '2xl' }}
						textAlign='justify'
					>
						This is Moinul. I am a Frontend Focused Full Stack Guy.
						Trying to master web3. This is my first complete dApp
						based on my own smart contract made with Solidity.
						Connect your wallet and Wave me back 🙌
					</Text>

					{!currentAccount ? (
						<Button
							colorScheme='blue'
							size='lg'
							disabled={currentAccount}
							onClick={connectWallet}
							isLoading={loading}
						>
							Connect your metamask wallet to get access to the
							app.
						</Button>
					) : (
						<Box>
							<Text fontSize='2xl'>
								Connected:{' '}
								<Text as='span' color='blue.400'>
									{currentAccount}
								</Text>
							</Text>
							<Text fontSize='2xl'>
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
									>
										Wavers List
									</TableCaption>
									<Thead>
										<Tr>
											<Th textColor='blue.500'>
												Address
											</Th>
											<Th textColor='blue.500' isNumeric>
												Date-Time
											</Th>
										</Tr>
									</Thead>
									<Tbody>
										{allWaves.length > 0 &&
											allWaves.map((wave, index) => (
												<Tr key={index}>
													<Td>{wave['waver']}</Td>
													<Td isNumeric>
														{new Date(
															wave[
																'timestamp'
															].toNumber() * 1000
														).toLocaleString()}
													</Td>
												</Tr>
											))}
									</Tbody>
								</Table>
							</TableContainer>
						</Box>
					)}

					{currentAccount ? (
						<Button
							colorScheme='blue'
							size='lg'
							onClick={waveHandler}
							isLoading={loading}
						>
							👋 Wave me back
						</Button>
					) : null}
				</VStack>
			</Container>
		</Box>
	);
}

export default App;
