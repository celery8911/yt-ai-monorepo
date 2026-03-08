// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SignatureVerifier
 * @notice 独立的 EIP-712 签名验证合约（不调用任何现有业务合约）
 * @dev 用于演示 EIP-712 结构化签名的验证流程
 *
 * 面试要点 (Q5 EIP-712 流程):
 * 1. Domain Separator = hashStruct(EIP712Domain(name, version, chainId, verifyingContract))
 * 2. structHash = keccak256(typeHash || encodedData)
 * 3. digest = keccak256("\x19\x01" || domainSeparator || structHash)
 * 4. 前端用 signTypedData 签名 digest → 得到 (r, s, v)
 * 5. 合约用 ECDSA.recover(digest, signature) 恢复签名者地址
 */
contract SignatureVerifier is EIP712 {
    using ECDSA for bytes32;

    /// @notice Quote 报价结构体
    struct Quote {
        string agentId;
        address owner;
        uint256 price;
        uint256 nonce;
        uint256 deadline;
    }

    /// @notice Quote 的 typeHash，用于 EIP-712 编码
    bytes32 public constant QUOTE_TYPEHASH =
        keccak256("Quote(string agentId,address owner,uint256 price,uint256 nonce,uint256 deadline)");

    /// @notice 跟踪每个地址已使用的 nonce，防止签名重放
    mapping(address => uint256) public nonces;

    /// @notice 签名验证成功事件
    event QuoteVerified(address indexed signer, string agentId, uint256 price);

    /// @notice 批量验证完成事件
    event BatchVerified(uint256 total, uint256 valid);

    error ExpiredSignature(uint256 deadline);
    error InvalidSignature(address recovered, address expected);
    error InvalidNonce(uint256 expected, uint256 got);

    constructor() EIP712("YT Agent Market", "1") {}

    /**
     * @notice 验证单个 Quote 签名
     * @param quote 报价数据
     * @param signature 签名 (65 bytes: r + s + v)
     * @return valid 签名是否有效
     *
     * 验证流程:
     * 1. 检查 deadline 未过期
     * 2. 计算 structHash = keccak256(typeHash, agentId, owner, price, nonce, deadline)
     * 3. 计算 digest = _hashTypedDataV4(structHash) (包含 domain separator)
     * 4. ECDSA.recover(digest, signature) → 恢复签名者地址
     * 5. 比对恢复的地址是否等于 quote.owner
     */
    function verifyQuote(
        Quote calldata quote,
        bytes calldata signature
    ) public view returns (bool valid) {
        if (block.timestamp > quote.deadline) {
            return false;
        }

        bytes32 structHash = keccak256(
            abi.encode(
                QUOTE_TYPEHASH,
                keccak256(bytes(quote.agentId)),
                quote.owner,
                quote.price,
                quote.nonce,
                quote.deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);

        return recovered == quote.owner;
    }

    /**
     * @notice 批量验证多个 Quote 签名 (覆盖 Q7: 签名合并/批量验证)
     * @param quotes 报价数组
     * @param signatures 签名数组
     * @return results 每个签名的验证结果
     */
    function verifyBatchQuotes(
        Quote[] calldata quotes,
        bytes[] calldata signatures
    ) external view returns (bool[] memory results) {
        require(quotes.length == signatures.length, "Length mismatch");

        results = new bool[](quotes.length);
        for (uint256 i = 0; i < quotes.length; i++) {
            results[i] = verifyQuote(quotes[i], signatures[i]);
        }
    }

    /**
     * @notice 验证并记录 Quote（消耗 nonce，防止重放）
     * @param quote 报价数据
     * @param signature 签名
     */
    function verifyAndRecord(
        Quote calldata quote,
        bytes calldata signature
    ) external {
        if (block.timestamp > quote.deadline) {
            revert ExpiredSignature(quote.deadline);
        }

        if (quote.nonce != nonces[quote.owner]) {
            revert InvalidNonce(nonces[quote.owner], quote.nonce);
        }

        bytes32 structHash = keccak256(
            abi.encode(
                QUOTE_TYPEHASH,
                keccak256(bytes(quote.agentId)),
                quote.owner,
                quote.price,
                quote.nonce,
                quote.deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);

        if (recovered != quote.owner) {
            revert InvalidSignature(recovered, quote.owner);
        }

        nonces[quote.owner]++;
        emit QuoteVerified(quote.owner, quote.agentId, quote.price);
    }

    /// @notice 获取 domain separator（面试时可以展示）
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
